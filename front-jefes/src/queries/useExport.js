import { useMutation } from '@tanstack/react-query';
import { exportSurvey, exportContacts, exportContactsExcel } from '../api/export';

export const useExportSurvey = () => {
    return useMutation({
        mutationFn: ({ id, params }) => exportSurvey(id, params)
    });
};

export const useExportContacts = () => {
    return useMutation({
        mutationFn: (params) => exportContacts(params)
    });
};

export const useExportContactsExcel = () => {
    return useMutation({
        mutationFn: (params) => exportContactsExcel(params)
    });
};