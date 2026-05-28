import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getActiveSurveys, getSurvey, getRelevamiento, submitSurvey } from '../api';

export const useActiveSurveys = () => {
    return useQuery({
        queryKey: ['surveys', 'active'],
        queryFn: getActiveSurveys,
        staleTime: 1000 * 60 * 5, // 5 minutos
    });
};

export const useSurveyDetail = (id) => {
    return useQuery({
        queryKey: ['survey', id],
        queryFn: () => getSurvey(id),
        enabled: !!id,
        staleTime: 1000 * 60 * 5, // 5 minutos
    });
};

export const useRelevamientoDetail = () => {
    return useQuery({
        queryKey: ['survey', 'relevamiento'],
        queryFn: getRelevamiento,
        staleTime: 1000 * 60 * 5, // 5 minutos
        retry: false, // En caso de que falle porque no hay relevamiento activo
    });
};

export const useSubmitSurvey = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({ id, payload }) => submitSurvey(id, payload),
        onSuccess: (data, variables) => {
            queryClient.invalidateQueries({ queryKey: ['surveys'] });
            queryClient.invalidateQueries({ queryKey: ['survey', variables.id] });
            queryClient.invalidateQueries({ queryKey: ['my-responses'] });
        }
    });
};
