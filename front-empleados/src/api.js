// front-empleados/src/api.js

// URL Real del Backend
export const API_URL = import.meta.env.VITE_API_URL || 'https://api.ushuaiamovimiento.com.ar';

export const handleResponse = async (response) => {
    // Si el token falló (401) o no tiene permiso (403)
    if (response.status === 401 || response.status === 403) {
        // Borramos todo
        localStorage.clear();
        // Lo mandamos al Login Principal (Portero)
        window.location.href = 'https://ushuaiamovimiento.com.ar';
        throw new Error('Sesión expirada o sin permiso');
    }

    if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.detail || 'Error en la petición');
    }

    if (response.status === 204) return null;

    return response.json();
};

const getHeaders = () => {
    const token = localStorage.getItem('access_token');
    return {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
    };
};

// --- TUS FUNCIONES DE API ---

export const login = async (email, password) => {
    const response = await fetch(`${API_URL}/api/token/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
    });
    // Nota: El login aquí devuelve los tokens directos
    if (!response.ok) throw new Error('Credenciales inválidas');
    return response.json();
};

export const getActiveSurveys = async () => {
    const response = await fetch(`${API_URL}/api/surveys/active/`, {
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

export const submitSurvey = async (id, payload) => {
    const headers = getHeaders();
    let body = payload;

    // Si es FormData, dejamos que el navegador ponga el Content-Type (multipart...)
    // Si es JSON, stringify y Header application/json (ya puesto por getHeaders)
    if (payload instanceof FormData) {
        delete headers['Content-Type'];
    } else {
        body = JSON.stringify(payload);
    }

    // Checking if it is a manual submission (has usuario_id in payload)
    const isManual = payload instanceof FormData ? payload.has('usuario_id') : payload.usuario_id;
    const endpointUrl = isManual ? `${API_URL}/api/surveys/${id}/respond/manual/` : `${API_URL}/api/surveys/${id}/respond/`;

    try {
        const response = await fetch(endpointUrl, {
            method: 'POST',
            headers: headers,
            body: body
        });
        
        // 1. Error por peso u otros.
        if (!response.ok) {
            if (response.status === 413) {
                throw new Error("El archivo supera el límite de peso permitido por el servidor.");
            }
        }
        
        return handleResponse(response);
    } catch (error) {
        // 2. Error por falla de conexión (Se cortó el internet o el server murió)
        if (error.name === 'TypeError' || error.message === 'Failed to fetch') {
            throw new Error("Se perdió la conexión a internet durante la subida. Revisa tu red y vuelve a intentar sin recargar la página.");
        } else {
            throw error;
        }
    }
};

export const getUsers = async () => {
    const response = await fetch(`${API_URL}/api/users/all/`, {
        headers: getHeaders()
    });
    return handleResponse(response);
};

export const getLocations = async () => {
    const response = await fetch(`${API_URL}/api/surveys/locations/`, {
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

export const getMyResponses = async (page = 1) => {
    const response = await fetch(`${API_URL}/api/surveys/responses/me/?page=${page}`, {
        headers: getHeaders()
    });
    return handleResponse(response);
};

export const getResponseDetail = async (id) => {
    const response = await fetch(`${API_URL}/api/surveys/responses/${id}/`, {
        headers: getHeaders()
    });
    return handleResponse(response);
};

export const getCurrentUser = async () => {
    const response = await fetch(`${API_URL}/api/auth/me/`, {
        headers: getHeaders()
    });
    return handleResponse(response);
};

export const getBirthdays = async (day = 'today') => {
    const response = await fetch(`${API_URL}/api/enrollments/people/birthdays/?day=${day}`, {
        headers: getHeaders()
    });
    return handleResponse(response);
};

export const deliverBirthday = async (personId, observacion = '') => {
    const response = await fetch(`${API_URL}/api/enrollments/people/${personId}/deliver-birthday/`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify({ observacion })
    });
    return handleResponse(response);
};
