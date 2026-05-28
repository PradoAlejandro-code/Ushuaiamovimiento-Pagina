import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getBirthdays, assignBirthdays, getActiveUsers, getPendingObservations, resolveObservation } from '../api/birthdays';

export const useBirthdays = (day = 'today', page = 1, search = '', filters = {}) => {
    return useQuery({
        queryKey: ['birthdays', day, page, search, filters],
        queryFn: () => getBirthdays(day, page, search, filters),
        keepPreviousData: true,
    });
};

export const useAssignBirthdays = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: assignBirthdays,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['birthdays'] });
        }
    });
};

export const useActiveUsers = () => {
    return useQuery({
        queryKey: ['active-users'],
        queryFn: getActiveUsers,
        staleTime: 5 * 60 * 1000,
    });
};

export const usePendingObservations = () => {
    return useQuery({
        queryKey: ['pending-observations'],
        queryFn: getPendingObservations,
        staleTime: 30 * 1000,
    });
};

export const useResolveObservation = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: resolveObservation,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['pending-observations'] });
        }
    });
};

