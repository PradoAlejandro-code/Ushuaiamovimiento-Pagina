import apiClient from './client';

export const extendSession = () => apiClient.post('/api/auth/extend-session/');