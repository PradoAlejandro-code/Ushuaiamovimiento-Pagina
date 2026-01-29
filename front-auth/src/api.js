const API_URL = import.meta.env.VITE_API_URL || 'https://api.ushuaiamovimiento.com.ar';

export const login = async (email, password) => {
    const response = await fetch(`${API_URL}/api/token/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
    });

    if (!response.ok) throw new Error('Credenciales inválidas');
    return response.json();
};
