import apiClient from './apiClient';
import { buildMultipartForm } from '../utils/multipart';

export const getSales = () => apiClient.get('/sales');
export const createSale = (payload, prescriptionAsset) => {
	const formData = buildMultipartForm(payload, 'prescriptionImage', prescriptionAsset);
	return apiClient.post('/sales', formData, {
		headers: { 'Content-Type': 'multipart/form-data' }
	});
};

export const updateSale = (id, payload, prescriptionAsset) => {
	const formData = buildMultipartForm(payload, 'prescriptionImage', prescriptionAsset);
	return apiClient.put(`/sales/${id}`, formData, {
		headers: { 'Content-Type': 'multipart/form-data' }
	});
};

export const deleteSale = (id) => apiClient.delete(`/sales/${id}`);
