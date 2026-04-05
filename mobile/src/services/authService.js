import apiClient from './apiClient';

export const loginApi = (payload) => apiClient.post('/auth/login', payload);
export const registerApi = (payload) => apiClient.post('/auth/register', payload);
