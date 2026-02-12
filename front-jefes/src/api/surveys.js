import apiClient from './client';

// --- GESTIÓN DE ENCUESTAS ---
export const getAllSurveys = () => apiClient.get('/api/surveys/all/');
export const getSurvey = (id) => apiClient.get(`/api/surveys/${id}/`);
export const getRelevamiento = () => apiClient.get('/api/surveys/relevamiento/');
export const createSurvey = (payload) => apiClient.post('/api/surveys/create/', payload);
export const updateSurvey = (id, payload) => apiClient.patch(`/api/surveys/${id}/`, payload);

// --- PREGUNTAS ---
export const createQuestion = (payload) => apiClient.post('/api/surveys/preguntas/create/', payload);
export const updateQuestion = (id, payload) => apiClient.patch(`/api/surveys/preguntas/${id}/`, payload);
export const deleteQuestion = (id) => apiClient.delete(`/api/surveys/preguntas/${id}/`);

// --- RESPUESTAS (La data generada) ---
export const getSurveyResponses = (id) => apiClient.get(`/api/surveys/${id}/respuestas/`);

export const updateResponse = (id, payload) => {
    const isFormData = payload instanceof FormData;
    return apiClient.patch(`/api/surveys/responses/${id}/`, payload, {
        headers: isFormData ? { 'Content-Type': 'multipart/form-data' } : {}
    });
};

export const deleteResponse = (id) => apiClient.delete(`/api/surveys/responses/${id}/`);