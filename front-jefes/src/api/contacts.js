import apiClient from './client';

export const getContacts = (id = null) => {
    const url = id ? `/api/contacts/encuesta/${id}/` : `/api/contacts/`;
    return apiClient.get(url);
};

export const saveContact = (data) => {
    const method = data.id ? 'put' : 'post';
    const url = data.id ? `/api/contacts/${data.id}/` : '/api/contacts/';
    return apiClient[method](url, data);
};

export const deleteContact = (id) => apiClient.delete(`/api/contacts/${id}/`);

export const importContacts = (formData) =>
    apiClient.post('/api/contacts/importar/', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
    });