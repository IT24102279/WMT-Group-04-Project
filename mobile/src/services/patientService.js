import apiClient from './apiClient';
import { buildMultipartForm } from '../utils/multipart';

export const getPatients = () => apiClient.get('/patients');
export const getPatientById = (id) => apiClient.get(`/patients/${id}`);

export const createPatient = (payload, consentAsset) => {
	const formData = buildMultipartForm(payload, 'consentForm', consentAsset);
	return apiClient.post('/patients', formData, {
		headers: { 'Content-Type': 'multipart/form-data' }
	});
};

export const updatePatient = (id, payload, consentAsset) => {
	const formData = buildMultipartForm(payload, 'consentForm', consentAsset);
	return apiClient.put(`/patients/${id}`, formData, {
		headers: { 'Content-Type': 'multipart/form-data' }
	});
};

export const deletePatient = (id) => apiClient.delete(`/patients/${id}`);
