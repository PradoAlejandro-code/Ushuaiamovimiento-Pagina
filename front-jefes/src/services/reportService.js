const API_URL = import.meta.env.VITE_API_URL || 'https://api.ushuaiamovimiento.com.ar';

const getHeaders = () => {
    const token = localStorage.getItem('access_token');
    return {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
    };
};

export const getPhotos = async () => {
    try {
        const response = await fetch(`${API_URL}/api/reports/gallery/`, {
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('access_token')}`
            }
        });
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        return data;
    } catch (error) {
        console.error("Error fetching photos:", error);
        throw error;
    }
};

export const createInforme = async (informeData) => {
    try {
        const response = await fetch(`${API_URL}/api/reports/create/`, {
            method: 'POST',
            headers: getHeaders(),
            body: JSON.stringify(informeData)
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        return await response.json();
    } catch (error) {
        console.error("Error creating report:", error);
        throw error;
    }
};
