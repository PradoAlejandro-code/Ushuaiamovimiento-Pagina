import { useQuery } from '@tanstack/react-query';
import { getLocations } from '../api';

export const useLocationsList = (enabled = true) => {
    return useQuery({
        queryKey: ['locations'],
        queryFn: getLocations,
        enabled: enabled,
        staleTime: 1000 * 60 * 60 * 24, // 24 horas (las ubicaciones rara vez cambian)
    });
};
