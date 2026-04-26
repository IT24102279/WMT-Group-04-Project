import apiClient from './apiClient';
import { buildMultipartForm } from '../utils/multipart';

export const getShopProducts = () => apiClient.get('/shop/products');
export const getShopProductById = (id) => apiClient.get(`/shop/products/${id}`);
export const createShopProduct = (payload, imageAsset) => {
  const formData = buildMultipartForm(payload, 'image', imageAsset);
  return apiClient.post('/shop/products', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  });
};
export const updateShopProduct = (id, payload, imageAsset) => {
  const formData = buildMultipartForm(payload, 'image', imageAsset);
  return apiClient.put(`/shop/products/${id}`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  });
};
export const deleteShopProduct = (id) => apiClient.delete(`/shop/products/${id}`);

export const getOrders = () => apiClient.get('/shop/orders');
export const createOrder = (payload) => apiClient.post('/shop/orders', payload);
export const updateOrder = (id, payload) => apiClient.put(`/shop/orders/${id}`, payload);
export const deleteOrder = (id) => apiClient.delete(`/shop/orders/${id}`);
export const assignOrderDriver = (orderId, driverId) =>
  apiClient.patch(`/shop/orders/${orderId}/assign-driver`, { driverId });

export const uploadProofOfDelivery = (orderId, proofAsset) => {
  const formData = buildMultipartForm({}, 'proof', proofAsset);
  return apiClient.post(`/shop/orders/${orderId}/proof-of-delivery`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  });
};
