import apiClient from './apiClient';

export const sendMessage = (subject, content, recipientId = null) =>
  apiClient.post('/messages', { subject, content, recipientId });

export const getMessages = () =>
  apiClient.get('/messages');

export const getConversations = () =>
  apiClient.get('/messages/conversations');

export const getMessageThread = (messageId) =>
  apiClient.get(`/messages/thread/${messageId}`);

export const replyToMessage = (messageId, content) =>
  apiClient.post(`/messages/${messageId}/reply`, { content });

export const markAsRead = (messageId) =>
  apiClient.put(`/messages/${messageId}/read`);

export const deleteMessage = (messageId) =>
  apiClient.delete(`/messages/${messageId}`);

export const updateMessage = (messageId, payload) =>
  apiClient.put(`/messages/${messageId}`, payload);

export const deleteConversation = (partnerId) =>
  apiClient.delete(`/messages/conversation/${partnerId}`);
