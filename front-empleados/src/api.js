// front-empleados/src/api.js

// URL Real del Backend
const API_URL = import.meta.env.VITE_API_URL || 'https://api.ushuaiamovimiento.com.ar';

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

    const response = await fetch(`${API_URL}/api/surveys/${id}/respond/`, {
        method: 'POST',
        headers: headers,
        body: body
    });
    return handleResponse(response);
};

export const getLocations = async () => {
    const response = await fetch(`${API_URL}/api/surveys/locations/`, {
        headers: getHeaders()
    });
    return handleResponse(response);
};
