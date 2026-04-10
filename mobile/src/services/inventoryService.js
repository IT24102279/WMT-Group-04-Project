import apiClient from './apiClient';
import { buildMultipartForm } from '../utils/multipart';

export const getInventoryItems = () => apiClient.get('/inventory');
export const getNearExpiryItems = (days = 30) => apiClient.get(`/inventory/near-expiry?days=${days}`);

export const createInventoryItem = (payload, invoiceAsset) => {
  const formData = buildMultipartForm(payload, 'invoice', invoiceAsset);
  return apiClient.post('/inventory', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  });
};

export const updateInventoryItem = (id, payload, invoiceAsset) => {
  const formData = buildMultipartForm(payload, 'invoice', invoiceAsset);
  return apiClient.put(`/inventory/${id}`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  });
};

export const deleteInventoryItem = (id) => apiClient.delete(`/inventory/${id}`);
