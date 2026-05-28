import apiClient from './client';

export const extendSession = () => apiClient.post('/api/auth/extend-session/');
export const getProfile = () => apiClient.get('/api/auth/me/');