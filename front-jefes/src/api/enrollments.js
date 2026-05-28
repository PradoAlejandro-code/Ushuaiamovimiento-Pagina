import apiClient from './client';

// Enrollment Lists (Padrones)
export const getEnrollmentLists = () => apiClient.get('/api/enrollments/lists/');
export const getEnrollmentList = (id) => apiClient.get(`/api/enrollments/lists/${id}/`);
export const createEnrollmentList = (data) => apiClient.post('/api/enrollments/lists/', data);
export const updateEnrollmentList = (id, data) => apiClient.patch(`/api/enrollments/lists/${id}/`, data);
export const deleteEnrollmentList = (id) => apiClient.delete(`/api/enrollments/lists/${id}/`);
export const previewImport = (id, formData) => apiClient.post(`/api/import/enrollments/${id}/preview/`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
});
export const confirmImport = (id, formData) => apiClient.post(`/api/import/enrollments/${id}/confirm/`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
});
export const getImportStatus = (id) => apiClient.get(`/api/import/enrollments/${id}/status/`);
export const importBatch = (id, data) => apiClient.post(`/api/import/enrollments/${id}/batch/`, data);

// Enrollees (Personas en un padrón)
export const getEnrollees = (listId, page = 1, filters = {}, sorting = []) => {
    const params = { enrollment_list: listId, page, ...filters };
    if (sorting && sorting.length > 0) {
        const sort = sorting[0];
        params.ordering = sort.desc ? `-${sort.id}` : sort.id;
    }
    return apiClient.get('/api/enrollments/enrollees/', { params });
};
export const getEnrollee = (id) => apiClient.get(`/api/enrollments/enrollees/${id}/`);
export const createEnrollee = (data) => apiClient.post('/api/enrollments/enrollees/', data);
export const updateEnrollee = (id, data) => apiClient.put(`/api/enrollments/enrollees/${id}/`, data);
export const deleteEnrollee = (id) => apiClient.delete(`/api/enrollments/enrollees/${id}/`);
export const deleteEnrollees = (data) => apiClient.post('/api/enrollments/enrollees/bulk-delete/', data);

// Fields (Columnas)
export const updateListField = (id, data) => apiClient.patch(`/api/enrollments/fields/${id}/`, data);
export const deleteListField = (id) => apiClient.delete(`/api/enrollments/fields/${id}/`);

// Persons
export const getPersonCities = (listId) => {
    const params = listId ? { enrollment_list: listId } : {};
    return apiClient.get('/api/enrollments/people/cities/', { params });
};
export const getPersonWorkplaces = (listId) => {
    const params = listId ? { enrollment_list: listId } : {};
    return apiClient.get('/api/enrollments/people/workplaces/', { params });
};
export const getPersonEmploymentStatuses = (listId) => {
    const params = listId ? { enrollment_list: listId } : {};
    return apiClient.get('/api/enrollments/people/employment-statuses/', { params });
};