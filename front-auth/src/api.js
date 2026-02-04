const isLocal = window.location.hostname.includes('localhost') || window.location.hostname.includes('127.0.0.1');

const API_URL = import.meta.env.VITE_API_URL || (isLocal ? 'http://127.0.0.1:8000' : 'https://api.ushuaiamovimiento.com.ar');

export const login = async (email, password) => {
    const response = await fetch(`${API_URL}/api/token/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
    });

    if (!response.ok) {
        let errorMessage = 'Credenciales inválidas';
        try {
            const errorData = await response.json();
            // Prioritize 'detail' which we set in backend serializers
            errorMessage = errorData.detail || (errorData.non_field_errors && errorData.non_field_errors[0]) || errorMessage;
        } catch (e) {
            console.error("Error parsing error response", e);
        }
        throw new Error(errorMessage);
    }
    return response.json();
};

export const redirectUser = (sector, token) => {
    const isLocal = window.location.hostname.includes('localhost') || window.location.hostname.includes('127.0.0.1');
    const PROTOCOLO = window.location.protocol;
    const DOMINIO_RAIZ = isLocal ? 'localhost' : 'ushuaiamovimiento.com.ar';

    const PUERTOS_LOCALES = {
        'barrios': '3010',
        'stock': '3011',
        'default': '3010'
    };

    let urlFinal = "";

    if (isLocal) {
        const puerto = PUERTOS_LOCALES[sector] || PUERTOS_LOCALES['default'];
        urlFinal = `${PROTOCOLO}//localhost:${puerto}`;
    } else {
        urlFinal = `${PROTOCOLO}//${sector}.${DOMINIO_RAIZ}`;
    }

    window.location.href = `${urlFinal}?token=${token}`;
}; 
