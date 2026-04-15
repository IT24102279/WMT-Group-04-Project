import apiClient from './apiClient';
import { buildMultipartForm } from '../utils/multipart';

export const getAppointments = () => apiClient.get('/support/appointments');
export const createAppointment = (payload) => apiClient.post('/support/appointments', payload);
export const updateAppointment = (id, payload) => apiClient.put(`/support/appointments/${id}`, payload);
export const deleteAppointment = (id) => apiClient.delete(`/support/appointments/${id}`);
export const getSupportTickets = () => apiClient.get('/support/tickets');
export const createSupportTicket = (payload, reportAsset) => {
	const formData = buildMultipartForm(payload, 'report', reportAsset);
	return apiClient.post('/support/tickets', formData, {
		headers: { 'Content-Type': 'multipart/form-data' }
	});
};
export const updateSupportTicket = (id, payload, reportAsset) => {
	const formData = buildMultipartForm(payload, 'report', reportAsset);
	return apiClient.put(`/support/tickets/${id}`, formData, {
		headers: { 'Content-Type': 'multipart/form-data' }
	});
};
export const deleteSupportTicket = (id) => apiClient.delete(`/support/tickets/${id}`);
