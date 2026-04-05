export const isValidEmail = (email) =>
  /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(email || '').trim());

export const sanitizeInteger = (value) => String(value || '').replace(/\D/g, '');

export const sanitizeDecimal = (value) => {
  const next = String(value || '').replace(/[^\d.]/g, '');
  const [whole, ...parts] = next.split('.');
  return parts.length ? `${whole}.${parts.join('')}` : whole;
};

export const hasRequiredValues = (payload, keys) =>
  keys.every((key) => String(payload?.[key] ?? '').trim().length > 0);

export const toIsoDate = (date) => {
  const d = new Date(date);
  return d.toISOString().slice(0, 10);
};
