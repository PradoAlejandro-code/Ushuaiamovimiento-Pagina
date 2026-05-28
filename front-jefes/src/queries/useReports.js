import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getPhotos, createInforme, getReports, deleteReport } from '../api/report';

export const useReports = () => {
    return useQuery({
        queryKey: ['reports'],
        queryFn: getReports,
    });
};

export const usePhotos = (params = {}) => {
    return useQuery({
        queryKey: ['photos', params],
        queryFn: () => getPhotos(params),
        // Podríamos poner un staleTime alto si las fotos históricas no cambian tan seguido
        staleTime: 1000 * 60 * 5,
    });
};

export const useCreateReport = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: createInforme,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['reports'] });
        }
    });
};

export const useDeleteReport = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: deleteReport,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['reports'] });
        }
    });
};
