import { useMutation } from '@tanstack/react-query';
import { extendSession } from '../api';

export const useExtendSessionMutation = () => {
    return useMutation({
        mutationFn: extendSession,
        onError: (err) => console.warn("Fallo al extender la sesión", err),
    });
};
