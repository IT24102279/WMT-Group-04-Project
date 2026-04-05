#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
BACKEND_DIR="$ROOT_DIR/backend"
MOBILE_DIR="$ROOT_DIR/mobile"
BACKEND_LOG="$ROOT_DIR/.backend-start.log"
BACKEND_URL="http://localhost:5000/api/health"
EXPO_API_URL="https://api.expo.dev/v2/sdks/51.0.0/native-modules"

cleanup() {
  if [[ -n "${BACKEND_PID:-}" ]] && kill -0 "$BACKEND_PID" >/dev/null 2>&1; then
    echo "Stopping backend (PID: $BACKEND_PID)..."
    kill "$BACKEND_PID" >/dev/null 2>&1 || true
  fi
}

trap cleanup EXIT INT TERM

if [[ ! -d "$BACKEND_DIR" || ! -d "$MOBILE_DIR" ]]; then
  echo "Error: backend/ or mobile/ folder not found."
  exit 1
fi

if [[ ! -d "$BACKEND_DIR/node_modules" ]]; then
  echo "Installing backend dependencies..."
  (cd "$BACKEND_DIR" && npm install)
fi

if [[ ! -d "$MOBILE_DIR/node_modules" ]]; then
  echo "Installing mobile dependencies..."
  (cd "$MOBILE_DIR" && npm install)
fi

echo "Starting backend server..."
(
  cd "$BACKEND_DIR"
  npm run start
) >"$BACKEND_LOG" 2>&1 &
BACKEND_PID=$!

echo "Waiting for backend health check..."
for _ in {1..40}; do
  if curl -fsS "$BACKEND_URL" >/dev/null 2>&1; then
    echo "Backend is up."
    break
  fi
  sleep 1
done

if ! curl -fsS "$BACKEND_URL" >/dev/null 2>&1; then
  echo "Backend failed to start. Last log lines:"
  tail -n 40 "$BACKEND_LOG" || true
  exit 1
fi

if [[ -f "$MOBILE_DIR/.env" ]]; then
  if grep -q "EXPO_PUBLIC_API_URL=http://localhost:5000/api" "$MOBILE_DIR/.env"; then
    echo "Warning: mobile/.env is using localhost."
    echo "For Expo Go on phone, set EXPO_PUBLIC_API_URL to your computer LAN IP."
  fi
fi

echo "Starting Expo..."

# Use offline mode when requested or when Expo API is unreachable.
EXPO_START_CMD="npm run start"
if [[ "${EXPO_OFFLINE:-0}" == "1" ]]; then
  EXPO_START_CMD="npx expo start --offline"
else
  if ! curl -fsS --max-time 5 "$EXPO_API_URL" >/dev/null 2>&1; then
    echo "Expo API is unreachable. Falling back to offline mode."
    EXPO_START_CMD="npx expo start --offline"
  fi
fi

if ! (
  cd "$MOBILE_DIR"
  eval "$EXPO_START_CMD"
); then
  echo "Expo start failed. Retrying with cache clear in offline mode..."
  (
    cd "$MOBILE_DIR"
    npx expo start --offline -c
  )
fi
