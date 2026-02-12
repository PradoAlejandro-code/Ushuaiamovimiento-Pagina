export const getAvatarUrl = (path) => {
    if (!path) return null;

    const API_BASE_URL = "https://api.ushuaiamovimiento.com.ar";

    let finalUrl = path.startsWith('http') ? path : `${API_BASE_URL}${path}`;

    if (finalUrl.startsWith('http://api.ushuaiamovimiento.com.ar')) {
        return finalUrl.replace('http://', 'https://');
    }

    return finalUrl;
};
