import { useQuery } from '@tanstack/react-query';
import { getCurrentUser, getUsers } from '../api';

export const useCurrentUser = () => {
    return useQuery({
        queryKey: ['currentUser'],
        queryFn: getCurrentUser,
        staleTime: 1000 * 60 * 30, // 30 minutos
        retry: 1,
    });
};

export const useAllUsers = (enabled = false) => {
    return useQuery({
        queryKey: ['users'],
        queryFn: getUsers,
        enabled: enabled,
        staleTime: 1000 * 60 * 5, // 5 minutos
    });
};
