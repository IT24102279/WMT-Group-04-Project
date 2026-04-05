import apiClient from './apiClient';
import { buildMultipartForm } from '../utils/multipart';

export const getTransactions = () => apiClient.get('/finance/transactions');
export const getPaymentReminders = () => apiClient.get('/finance/reminders/payments');
export const getCheckReminders = () => apiClient.get('/finance/reminders/checks');

export const createTransaction = (payload, documentAsset) => {
	const formData = buildMultipartForm(payload, 'document', documentAsset);
	return apiClient.post('/finance/transactions', formData, {
		headers: { 'Content-Type': 'multipart/form-data' }
	});
};

export const updateTransaction = (id, payload, documentAsset) => {
	const formData = buildMultipartForm(payload, 'document', documentAsset);
	return apiClient.put(`/finance/transactions/${id}`, formData, {
		headers: { 'Content-Type': 'multipart/form-data' }
	});
};

export const deleteTransaction = (id) => apiClient.delete(`/finance/transactions/${id}`);
