import { useQuery } from '@tanstack/react-query';
import { getMyResponses, getResponseDetail } from '../api';

export const useMyResponses = (page = 1) => {
    return useQuery({
        queryKey: ['my-responses', page],
        queryFn: () => getMyResponses(page),
        staleTime: 1000 * 60 * 1, // 1 minuto
    });
};

export const useResponseDetail = (id) => {
    return useQuery({
        queryKey: ['response-detail', id],
        queryFn: () => getResponseDetail(id),
        enabled: !!id,
        staleTime: 1000 * 60 * 5, // 5 minutos
    });
};
