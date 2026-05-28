import { useQuery, useMutation } from '@tanstack/react-query';
import { getProfile, extendSession } from '../api/auth';

export const useProfile = () => {
    return useQuery({
        queryKey: ['profile'],
        queryFn: getProfile,
        staleTime: 1000 * 60 * 30,
        retry: 1,
    });
};

export const useExtendSessionMutation = () => {
    return useMutation({
        mutationFn: extendSession,
        onError: (err) => console.warn("Fallo al extender la sesión", err),
    });
};