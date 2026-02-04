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
        let errorMessage = 'Error al realizar la petición';
        try {
            const errorData = await response.json();
            errorMessage = JSON.stringify(errorData); // O una propiedad específica si sabes cuál es
            console.error("Backend Error Details:", errorData);
        } catch (e) {
            // Si no es JSON, texto plano?
            try {
                const textError = await response.text();
                if (textError) errorMessage = textError;
            } catch (ignore) { }
        }
        throw new Error(errorMessage);
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

export const importContactos = async (archivo, tag) => {
    const formData = new FormData();
    formData.append('file', archivo);
    formData.append('tag', tag);

    // No enviamos Content-Type header manualmente con FormData, el navegador lo pone con el boundary
    const token = localStorage.getItem('access_token');
    const response = await fetch(`${API_URL}/api/surveys/contactos/importar/`, {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${token}`
        },
        body: formData
    });
    return handleResponse(response);
};

export const updateResponse = async (id, payload) => {
    // Si viene FormData (para imagenes), no stringify. Si es JSON object, stringify.
    const isFormData = payload instanceof FormData;
    const body = isFormData ? payload : JSON.stringify(payload);

    const headers = getHeaders();
    if (isFormData) {
        // Fetch pone el boundary automáticamente si quitamos Content-Type
        delete headers['Content-Type'];
    }

    const response = await fetch(`${API_URL}/api/surveys/responses/${id}/`, {
        method: 'PATCH',
        headers: headers,
        body: body
    });
    return handleResponse(response);
};

export const deleteResponse = async (id) => {
    const response = await fetch(`${API_URL}/api/surveys/responses/${id}/`, {
        method: 'DELETE',
        headers: getHeaders()
    });
    return handleResponse(response);
};

export const extendSession = async () => {
    const response = await fetch(`${API_URL}/api/auth/extend-session/`, {
        method: 'POST',
        headers: getHeaders()
    });
    return handleResponse(response);
};
