// front-jefes/src/api.js

// CAMBIO CRÍTICO: Usamos el dominio real https, no http ni localhost
const API_URL = import.meta.env.VITE_API_URL || 'https://api.ushuaiamovimiento.com.ar';

const handleResponse = async (response) => {
    if (response.status === 401) {
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
        localStorage.removeItem('role');
        localStorage.removeItem('user_name');
        // Redirigimos al login principal si expira la sesión
        window.location.href = 'https://ushuaiamovimiento.com.ar/login';
        throw new Error('Sesión expirada');
    }
    if (!response.ok) {
        throw new Error('Error al realizar la petición');
    }
    if (response.status === 204) {
        return null;
    }
    return response.json();
};

const getHeaders = () => {
    const token = localStorage.getItem('access_token');
    return {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
    };
};

// ... (El resto de tus funciones createSurvey, etc. déjalas igual) ...
// Solo asegúrate de copiar las exportaciones que ya tenías abajo.
export const createSurvey = async (payload) => {
    const response = await fetch(`${API_URL}/api/surveys/create/`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify(payload)
    });
    return handleResponse(response);
};

export const getAllSurveys = async () => {
    const response = await fetch(`${API_URL}/api/surveys/all/`, {
        headers: getHeaders()
    });
    return handleResponse(response);
};

export const getSurvey = async (id) => {
    const response = await fetch(`${API_URL}/api/surveys/${id}/`, {
        headers: getHeaders()
    });
    return handleResponse(response);
};

export const getRelevamiento = async () => {
    const response = await fetch(`${API_URL}/api/surveys/relevamiento/`, {
        headers: getHeaders()
    });
    return handleResponse(response);
};

export const updateSurvey = async (id, payload) => {
    const response = await fetch(`${API_URL}/api/surveys/${id}/`, {
        method: 'PATCH',
        headers: getHeaders(),
        body: JSON.stringify(payload)
    });
    return handleResponse(response);
};

export const createQuestion = async (payload) => {
    const response = await fetch(`${API_URL}/api/surveys/preguntas/create/`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify(payload)
    });
    return handleResponse(response);
};

export const updateQuestion = async (id, payload) => {
    const response = await fetch(`${API_URL}/api/surveys/preguntas/${id}/`, {
        method: 'PATCH',
        headers: getHeaders(),
        body: JSON.stringify(payload)
    });
    return handleResponse(response);
};

export const deleteQuestion = async (id) => {
    const response = await fetch(`${API_URL}/api/surveys/preguntas/${id}/`, {
        method: 'DELETE',
        headers: getHeaders()
    });
    return handleResponse(response);
};

export const getRecentResponses = async () => {
    const response = await fetch(`${API_URL}/api/surveys/responses/recent/`, {
        headers: getHeaders()
    });
    return handleResponse(response);
};

export const getSurveyContacts = async (id) => {
    const url = id
        ? `${API_URL}/api/surveys/${id}/contactos/`
        : `${API_URL}/api/surveys/contactos/all/`;

    const response = await fetch(url, {
        headers: getHeaders()
    });
    return handleResponse(response);
};

export const getSurveyResponses = async (id) => {
    const response = await fetch(`${API_URL}/api/surveys/${id}/respuestas/`, {
        headers: getHeaders()
    });
    return handleResponse(response);
};

export const getGlobalStats = async (period = 'day', groupBy = 'date') => {
    const response = await fetch(`${API_URL}/api/surveys/stats/global/?period=${period}&group_by=${groupBy}`, {
        headers: getHeaders()
    });
    return handleResponse(response);
};

export const getContactosDb = async () => {
    const response = await fetch(`${API_URL}/api/surveys/contactos/`, {
        headers: getHeaders()
    });
    return handleResponse(response);
};

export const saveContacto = async (contactoData) => {
    const method = contactoData.id ? 'PUT' : 'POST';
    const url = contactoData.id
        ? `${API_URL}/api/surveys/contactos/${contactoData.id}/`
        : `${API_URL}/api/surveys/contactos/`;

    const response = await fetch(url, {
        method: method,
        headers: getHeaders(),
        body: JSON.stringify(contactoData)
    });
    return handleResponse(response);
};

export const deleteContacto = async (id) => {
    const response = await fetch(`${API_URL}/api/surveys/contactos/${id}/`, {
        method: 'DELETE',
        headers: getHeaders()
    });
    return handleResponse(response);
};

export const importContactos = async (contactos, tag) => {
    const response = await fetch(`${API_URL}/api/surveys/contactos/importar/`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify({ contactos, tag })
    });
    return handleResponse(response);
};
