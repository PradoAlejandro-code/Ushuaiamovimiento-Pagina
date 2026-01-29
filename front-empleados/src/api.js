const API_URL = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000';

const getHeaders = () => {
    const token = localStorage.getItem('access_token');
    return {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
    };
};

const handleResponse = async (response) => {
    if (response.status === 401 || response.status === 403) {
        // Limpiamos todo rastro del usuario
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
        localStorage.removeItem('role');
        localStorage.removeItem('user_name');
        localStorage.removeItem('accesos');
        window.location.href = 'https://ushuaiamovimiento.com.ar';

        throw new Error('Acceso denegado o sesión expirada');
    }

    if (!response.ok) {
        let errorMessage = 'Error en la petición';
        try {
            const errorData = await response.json();
            errorMessage = errorData.error || errorData.details || JSON.stringify(errorData) || errorMessage;
        } catch (e) {

        }
        throw new Error(errorMessage);
    }
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
