import apiClient from './client';

export const getPhotos = (params = {}) => {
    return apiClient.get('/api/reports/gallery/', { params });
};

export const createInforme = (informeData) => {
    return apiClient.post('/api/reports/create/', informeData);
};

export const getReports = () => {
    return apiClient.get('/api/reports/all/');
};

export const deleteReport = (id) => {
    return apiClient.delete(`/api/reports/${id}/delete/`);
};