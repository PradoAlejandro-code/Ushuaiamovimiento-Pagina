import { useQuery, useMutation, useQueryClient, keepPreviousData } from '@tanstack/react-query';
import {
    getEnrollmentLists,
    getEnrollmentList,
    createEnrollmentList,
    updateEnrollmentList,
    deleteEnrollmentList,
    previewImport,
    confirmImport,
    importBatch,
    getEnrollees,
    getEnrollee,
    createEnrollee,
    updateEnrollee,
    deleteEnrollee,
    deleteEnrollees,
    updateListField,
    deleteListField,
    getPersonCities,
    getPersonWorkplaces,
    getPersonEmploymentStatuses
} from '../api/enrollments';

export const useEnrollmentLists = () => {
    return useQuery({
        queryKey: ['enrollment-lists'],
        queryFn: getEnrollmentLists,
    });
};

export const useEnrollmentListDetail = (id) => {
    return useQuery({
        queryKey: ['enrollment-list', id],
        queryFn: () => getEnrollmentList(id),
        enabled: !!id,
    });
};

export const useCreateEnrollmentList = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: createEnrollmentList,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['enrollment-lists'] });
        }
    });
};

export const useUpdateEnrollmentList = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({ id, data }) => updateEnrollmentList(id, data),
        onSuccess: (data, variables) => {
            queryClient.invalidateQueries({ queryKey: ['enrollment-lists'] });
            queryClient.invalidateQueries({ queryKey: ['enrollment-list', variables.id] });
        }
    });
};

export const useDeleteEnrollmentList = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: deleteEnrollmentList,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['enrollment-lists'] });
        }
    });
};

export const usePreviewImport = () => {
    return useMutation({
        mutationFn: ({ id, formData }) => previewImport(id, formData)
    });
};

export const useConfirmImport = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({ id, formData }) => confirmImport(id, formData),
        onSuccess: (data, variables) => {
            queryClient.invalidateQueries({ queryKey: ['enrollees', variables.id] });
            queryClient.invalidateQueries({ queryKey: ['enrollment-list', variables.id] });
        }
    });
};

export const useImportBatch = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({ id, data }) => importBatch(id, data),
        onSuccess: (data, variables) => {
            queryClient.invalidateQueries({ queryKey: ['enrollees', variables.id] });
            queryClient.invalidateQueries({ queryKey: ['enrollment-list', variables.id] });
        }
    });
};

// ==========================================
// --- ENROLLEES (PERSONAS) ---
// ==========================================

export const useEnrollees = (listId, page = 1, filters = {}, sorting = []) => {
    return useQuery({
        queryKey: ['enrollees', listId, page, filters, sorting],
        queryFn: () => getEnrollees(listId, page, filters, sorting),
        enabled: !!listId,
        placeholderData: keepPreviousData,
    });
};

export const useEnrolleeDetail = (id) => {
    return useQuery({
        queryKey: ['enrollee', id],
        queryFn: () => getEnrollee(id),
        enabled: !!id,
    });
};

export const useCreateEnrollee = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: createEnrollee,
        onSuccess: (data) => {
            if (data?.enrollment_list) {
                queryClient.invalidateQueries({ queryKey: ['enrollees', data.enrollment_list] });
            }
        }
    });
};

export const useUpdateEnrollee = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({ id, data }) => updateEnrollee(id, data),
        onSuccess: (data) => {
            if (data?.enrollment_list) {
                queryClient.invalidateQueries({ queryKey: ['enrollees', data.enrollment_list] });
                queryClient.invalidateQueries({ queryKey: ['enrollee', data.id] });
            }
        }
    });
};

export const useDeleteEnrollee = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: deleteEnrollee,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['enrollees'] });
        }
    });
};

export const useDeleteEnrollees = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: deleteEnrollees,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['enrollees'] });
        }
    });
};
export const useUpdateListField = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({ id, data }) => updateListField(id, data),
        onSuccess: (data) => {
            if (data?.enrollment_list) {
                queryClient.invalidateQueries({ queryKey: ['enrollment-list', data.enrollment_list] });
            }
        }
    });
};

export const useDeleteListField = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: deleteListField,
        onSuccess: (data, variables, context) => {
            queryClient.invalidateQueries({ queryKey: ['enrollment-lists'] });
            queryClient.invalidateQueries({ queryKey: ['enrollment-list'] });
        }
    });
};

export const usePersonCities = (listId) => {
    return useQuery({
        queryKey: ['person-cities', listId],
        queryFn: () => getPersonCities(listId),
        staleTime: 5 * 60 * 1000, // 5 minutos de caché
    });
};

export const usePersonWorkplaces = (listId) => {
    return useQuery({
        queryKey: ['person-workplaces', listId],
        queryFn: () => getPersonWorkplaces(listId),
        staleTime: 5 * 60 * 1000, // 5 minutos de caché
    });
};

export const usePersonEmploymentStatuses = (listId) => {
    return useQuery({
        queryKey: ['person-employment-statuses', listId],
        queryFn: () => getPersonEmploymentStatuses(listId),
        staleTime: 5 * 60 * 1000, // 5 minutos de caché
    });
};
