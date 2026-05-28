import apiClient from './client';

export const getRecentResponses = () =>
    apiClient.get('/api/surveys/responses/recent/');

export const getGlobalStats = (period = 'day', groupBy = 'user') =>
    apiClient.get('/api/metrics/stats/global/', {
        params: { period, group_by: groupBy }
    });

export const getQuickMetrics = () =>
    apiClient.get('/api/surveys/stats/quick/');

export const getSurveyStats = (surveyId, params = {}) =>
    apiClient.get(`/api/metrics/surveys/${surveyId}/stats/`, { params });