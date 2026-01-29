// front-auth/src/api.js

// Detectamos si estamos en local para usar la API local (igual que front-empleados)
// Si no, usamos la de producción.
const isLocal = window.location.hostname.includes('localhost') || window.location.hostname.includes('127.0.0.1');

const API_URL = import.meta.env.VITE_API_URL || (isLocal ? 'http://127.0.0.1:8000' : 'https://api.ushuaiamovimiento.com.ar');

export const login = async (email, password) => {
    const response = await fetch(`${API_URL}/api/token/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
    });

    if (!response.ok) throw new Error('Credenciales inválidas');
    return response.json();
};
