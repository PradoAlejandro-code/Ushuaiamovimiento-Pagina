import apiClient from './client';

export const getBirthdays = (day = 'today', page = 1, search = '', filters = {}) => {
    const params = { day, page, search, ...filters };
    return apiClient.get('/api/enrollments/people/birthdays/', { params });
};

export const assignBirthdays = (data) => {
    return apiClient.post('/api/enrollments/people/assign-birthdays/', data);
};

export const getActiveUsers = () => {
    return apiClient.get('/api/users/all/');
};

export const getPendingObservations = () => {
    return apiClient.get('/api/enrollments/people/pending-observations/');
};

export const resolveObservation = (assignmentId) => {
    return apiClient.post('/api/enrollments/people/resolve-observation/', { assignment_id: assignmentId });
};

