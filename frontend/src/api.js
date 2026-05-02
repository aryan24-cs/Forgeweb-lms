import axios from 'axios';

const api = axios.create({
    baseURL: import.meta.env.VITE_API_URL || '/api',
    // Enable response compression
    headers: {
        'Accept-Encoding': 'gzip, deflate, br',
    },
});

api.interceptors.request.use((config) => {
    const token = localStorage.getItem('fw_token');
    if (token) config.headers.Authorization = `Bearer ${token}`;
    return config;
});

// In-flight request deduplication for GET requests
const pendingRequests = new Map();

api.interceptors.request.use((config) => {
    if (config.method === 'get') {
        const key = `${config.method}:${config.url}`;
        if (pendingRequests.has(key)) {
            // Cancel duplicate — return the existing promise instead
            const controller = new AbortController();
            config.signal = controller.signal;
            controller.abort('Duplicate request cancelled');
            return config;
        }
        pendingRequests.set(key, true);
        // Clean up after response
        const originalUrl = config.url;
        config._dedupeKey = key;
    }
    return config;
});

api.interceptors.response.use(
    (res) => {
        if (res.config._dedupeKey) {
            pendingRequests.delete(res.config._dedupeKey);
        }
        return res;
    },
    (err) => {
        if (err.config?._dedupeKey) {
            pendingRequests.delete(err.config._dedupeKey);
        }
        if (err.response?.status === 401) {
            localStorage.removeItem('fw_token');
            localStorage.removeItem('fw_user');
            window.location.href = '/login';
        }
        return Promise.reject(err);
    }
);

export default api;
