import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
    getAllSurveys,
    getSurvey,
    getRelevamiento,
    createSurvey,
    updateSurvey,
    createQuestion,
    updateQuestion,
    deleteQuestion,
    createGrupo,
    updateGrupo,
    deleteGrupo,
    getSections,
    getSurveyResponses,
    getSurveyRespondents,
    getSurveyResponse,
    updateResponse,
    deleteResponse
} from '../api/surveys';

// ==========================================
// --- ENCUESTAS ---
// ==========================================
export const useAllSurveys = (page = 1) => {
    return useQuery({
        queryKey: ['surveys', page],
        queryFn: () => getAllSurveys(page),
        staleTime: 1000 * 60 * 5,
    });
};

export const useSurveyDetail = (id, isRelevamiento = false) => {
    return useQuery({
        queryKey: isRelevamiento ? ['relevamiento'] : ['survey', id],
        queryFn: () => isRelevamiento ? getRelevamiento() : getSurvey(id),
        enabled: isRelevamiento ? true : !!id,
    });
};

export const useCreateSurvey = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: createSurvey,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['surveys'] });
        }
    });
};

export const useUpdateSurvey = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({ id, payload }) => updateSurvey(id, payload),
        onSuccess: (data, variables) => {
            queryClient.invalidateQueries({ queryKey: ['surveys'] });
            queryClient.invalidateQueries({ queryKey: ['survey', variables.id] });
            queryClient.invalidateQueries({ queryKey: ['relevamiento'] });
        }
    });
};

// ==========================================
// --- PREGUNTAS ---
// ==========================================
export const useCreateQuestion = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: createQuestion,
        onSuccess: (data) => {
            if (data?.survey) {
                queryClient.invalidateQueries({ queryKey: ['survey', data.survey] });
            }
            queryClient.invalidateQueries({ queryKey: ['relevamiento'] });
        }
    });
};

export const useUpdateQuestion = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({ id, payload }) => updateQuestion(id, payload),
        onSuccess: (data) => {
            if (data?.survey) {
                queryClient.invalidateQueries({ queryKey: ['survey', data.survey] });
            }
            queryClient.invalidateQueries({ queryKey: ['relevamiento'] });
        }
    });
};

export const useDeleteQuestion = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: deleteQuestion,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['survey'] });
            queryClient.invalidateQueries({ queryKey: ['relevamiento'] });
        }
    });
};

// ==========================================
// --- GRUPOS ---
// ==========================================
export const useCreateGrupo = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: createGrupo,
        onSuccess: (data) => {
            if (data?.survey) {
                queryClient.invalidateQueries({ queryKey: ['survey', data.survey] });
            }
            queryClient.invalidateQueries({ queryKey: ['relevamiento'] });
        }
    });
};

export const useUpdateGrupo = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({ id, payload }) => updateGrupo(id, payload),
        onSuccess: (data) => {
            if (data?.survey) {
                queryClient.invalidateQueries({ queryKey: ['survey', data.survey] });
            }
            queryClient.invalidateQueries({ queryKey: ['relevamiento'] });
        }
    });
};

export const useDeleteGrupo = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: deleteGrupo,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['survey'] });
            queryClient.invalidateQueries({ queryKey: ['relevamiento'] });
        }
    });
};

// ==========================================
// --- SECCIONES (Locations) ---
// ==========================================
export const useSections = (enabled = false) => {
    return useQuery({
        queryKey: ['sections'],
        queryFn: getSections,
        enabled: enabled,
        staleTime: 1000 * 60 * 60 * 24, // 24 horas. Los barrios/secciones casi nunca cambian.
    });
};

// ==========================================
// --- RESPUESTAS ---
// ==========================================
export const useSurveyResponses = (id, params = {}) => {
    return useQuery({
        queryKey: ['survey-responses', id, params],
        queryFn: () => getSurveyResponses(id, params),
        enabled: !!id,
    });
};

export const useSurveyRespondents = (id) => {
    return useQuery({
        queryKey: ['survey-respondents', id],
        queryFn: () => getSurveyRespondents(id),
        enabled: !!id,
    });
};

export const useSurveyResponseDetail = (id) => {
    return useQuery({
        queryKey: ['survey-response-detail', id],
        queryFn: () => getSurveyResponse(id),
        enabled: !!id,
    });
};

export const useUpdateResponse = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({ id, payload }) => updateResponse(id, payload),
        onSuccess: (data, variables) => {
            queryClient.invalidateQueries({ queryKey: ['survey-response-detail', variables.id] });
            queryClient.invalidateQueries({ queryKey: ['survey-responses'] });
        }
    });
};

export const useDeleteResponse = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: deleteResponse,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['survey-responses'] });
        }
    });
};