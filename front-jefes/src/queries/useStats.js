import { useQuery, keepPreviousData } from '@tanstack/react-query';
import { getSurveyStats, getRecentResponses, getGlobalStats } from '../api/stats';

export const useSurveyStats = (id, filters = {}) => {
    return useQuery({
        queryKey: ['survey-stats', id, filters],
        queryFn: () => getSurveyStats(id, filters),
        enabled: !!id,
    });
};

export const useRecentResponses = () => {
    return useQuery({
        queryKey: ['recent-responses'],
        queryFn: getRecentResponses,
        refetchInterval: 15000, // 15 seconds
    });
};

export const useGlobalStats = (period, viewType = 'user') => {
    return useQuery({
        queryKey: ['global-stats', period, viewType],
        queryFn: () => getGlobalStats(period, viewType),
        refetchInterval: 15000,
        placeholderData: keepPreviousData,
    });
};