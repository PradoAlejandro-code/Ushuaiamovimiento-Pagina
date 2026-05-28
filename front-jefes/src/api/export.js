import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'https://api.ushuaiamovimiento.com.ar';

export const exportSurvey = async (id, params = {}) => {
    const token = localStorage.getItem('access_token');

    // Devolvemos el response COMPLETO, no solo .data,
    // para que la vista pueda extraer headers si hiciera falta.
    return await axios.get(`${API_URL}/api/export/surveys/${id}/`, {
        headers: {
            'Authorization': `Bearer ${token}`
        },
        params: params,
        responseType: 'blob' // Clave para que Axios no destruya los bytes
    });
};

export const exportContacts = async (params = {}) => {
    const token = localStorage.getItem('access_token');

    return await axios.get(`${API_URL}/api/export/contacts/`, {
        headers: {
            'Authorization': `Bearer ${token}`
        },
        params: params,
        responseType: 'blob'
    });
};

export const exportContactsExcel = async (params = {}) => {
    const token = localStorage.getItem('access_token');

    return await axios.get(`${API_URL}/api/export/contacts/excel/`, {
        headers: {
            'Authorization': `Bearer ${token}`
        },
        params: params,
        responseType: 'blob'
    });
};
