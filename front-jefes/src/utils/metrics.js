import api from './index';

export const getDashboardStats = async (period = 'day', groupBy = 'user') => {
    try {
        const response = await api.get('/stats/dashboard/', {
            params: { period, group_by: groupBy }
        });
        return response.data;
    } catch (error) {
        console.error("Error en getDashboardStats:", error);
        throw error;
    }
};

export const getQuickMetrics = async () => {
    try {
        const response = await api.get('/stats/quick-metrics/');
        return response.data;
    } catch (error) {
        console.error("Error en getQuickMetrics:", error);
        throw error;
    }
};