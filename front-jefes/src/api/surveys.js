import apiClient from './client';
export const getAllSurveys = (page = 1) => apiClient.get(`/api/surveys/all/?page=${page}`);

export const getSurvey = (id) => apiClient.get(`/api/surveys/${id}/`);
export const getRelevamiento = () => apiClient.get('/api/surveys/relevamiento/');
export const getSections = () => apiClient.get('/api/surveys/locations/');
export const createSurvey = (payload) => apiClient.post('/api/surveys/create/', payload);
export const updateSurvey = (id, payload) => apiClient.patch(`/api/surveys/${id}/`, payload);
export const createQuestion = (payload) => apiClient.post('/api/surveys/preguntas/create/', payload);
export const updateQuestion = (id, payload) => apiClient.patch(`/api/surveys/preguntas/${id}/`, payload);
export const deleteQuestion = (id) => apiClient.delete(`/api/surveys/preguntas/${id}/`);
export const createGrupo = (payload) => apiClient.post('/api/surveys/grupos/create/', payload);
export const updateGrupo = (id, payload) => apiClient.patch(`/api/surveys/grupos/${id}/`, payload);
export const deleteGrupo = (id) => apiClient.delete(`/api/surveys/grupos/${id}/`);

export const getSurveyResponses = (id, params = {}) => {
    const queryParams = typeof params === 'number' ? { page: params } : params;
    return apiClient.get(`/api/surveys/${id}/respuestas/`, { params: queryParams });
};

export const getSurveyRespondents = (id) => apiClient.get(`/api/surveys/${id}/respondents/`);

export const getSurveyResponse = (id) => apiClient.get(`/api/surveys/responses/${id}/`);

export const updateResponse = (id, payload) => {
    const isFormData = payload instanceof FormData;
    return apiClient.patch(`/api/surveys/responses/${id}/`, payload, {
        headers: isFormData ? { 'Content-Type': 'multipart/form-data' } : {}
    });
};

export const deleteResponse = (id) => apiClient.delete(`/api/surveys/responses/${id}/`);