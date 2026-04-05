import axios from 'axios';
import Constants from 'expo-constants';

const getExpoHost = () => {
  const hostUri =
    Constants?.expoConfig?.hostUri ||
    Constants?.manifest2?.extra?.expoClient?.hostUri ||
    Constants?.manifest?.debuggerHost ||
    '';

  if (!hostUri) {
    return '';
  }

  return hostUri.split(':')[0];
};

const resolveApiBaseUrl = () => {
  const envUrl = process.env.EXPO_PUBLIC_API_URL;
  if (envUrl && envUrl.trim()) {
    return envUrl.trim();
  }

  const expoHost = getExpoHost();
  if (expoHost) {
    return `http://${expoHost}:5000/api`;
  }

  return 'http://localhost:5000/api';
};

const API_BASE_URL = resolveApiBaseUrl();

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000
});

console.log('API base URL:', API_BASE_URL);

export const setAuthToken = (token) => {
  if (token) {
    apiClient.defaults.headers.common.Authorization = `Bearer ${token}`;
  } else {
    delete apiClient.defaults.headers.common.Authorization;
  }
};

export default apiClient;
