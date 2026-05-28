import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getBirthdays, deliverBirthday } from '../api';

export const useBirthdaysList = (day = 'today', options = {}) => {
    return useQuery({
        queryKey: ['birthdays', day],
        queryFn: () => getBirthdays(day),
        staleTime: 1000 * 60 * 1, // 1 minuto
        ...options,
    });
};

export const useDeliverBirthday = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({ personId, observacion }) => deliverBirthday(personId, observacion),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['birthdays'] });
        }
    });
};
