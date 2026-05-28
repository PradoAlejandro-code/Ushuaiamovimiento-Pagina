const API_URL = import.meta.env.VITE_API_URL || 'https://api.ushuaiamovimiento.com.ar';

const getHeaders = () => {
    const token = localStorage.getItem('access_token');
    return {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
    };
};

export const getPhotos = async (params = {}) => {
    try {
        const queryParams = new URLSearchParams();
        Object.entries(params).forEach(([key, value]) => {
            if (value) queryParams.append(key, value);
        });

        const url = `${API_URL}/api/reports/gallery/${queryParams.toString() ? '?' + queryParams.toString() : ''}`;

        const response = await fetch(url, {
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

export const getReports = async () => {
    try {
        const response = await fetch(`${API_URL}/api/reports/all/`, {
            headers: getHeaders()
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        return await response.json();
    } catch (error) {
        console.error("Error fetching reports:", error);
        throw error;
    }
};

export const deleteReport = async (id) => {
    try {
        const response = await fetch(`${API_URL}/api/reports/${id}/delete/`, {
            method: 'DELETE',
            headers: getHeaders()
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        // Si la respuesta es 204 No Content, response.json() fallará, pero podemos retornar true.
        // Como DestroyAPIView de DRF retorna 204, chequeamos el status:
        if (response.status === 204) {
            return true;
        }

        return await response.json();
    } catch (error) {
        console.error("Error deleting report:", error);
        throw error;
    }
};
