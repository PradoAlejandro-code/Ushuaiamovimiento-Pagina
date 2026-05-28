import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getContacts, saveContact, deleteContact, importContacts } from '../api/contacts';

export const useContactsList = (id = null) => {
    return useQuery({
        queryKey: ['contacts', id],
        queryFn: () => getContacts(id),
        staleTime: 1000 * 60 * 5,
    });
};

export const useSaveContact = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: saveContact,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['contacts'] });
        }
    });
};

export const useDeleteContact = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: deleteContact,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['contacts'] });
        }
    });
};

export const useImportContacts = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: importContacts,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['contacts'] });
        }
    });
};