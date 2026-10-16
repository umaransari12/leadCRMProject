import axios from 'axios';

// In production (Vercel) the API is served from the same origin, so REACT_APP_API_URL is empty ('') and
// requests use relative /api/... paths. In local development it is unset and defaults to the local backend.
const baseURL = process.env.REACT_APP_API_URL !== undefined ? process.env.REACT_APP_API_URL : 'http://localhost:5000';

const api = axios.create({ baseURL });

api.interceptors.request.use((config) => {
    const token = localStorage.getItem('token');
    if (token) config.headers.Authorization = `Bearer ${token}`;
    return config;
});

// A rejected token (expired, or issued before this API required login) sends the user back to sign in.
api.interceptors.response.use(
    (response) => response,
    (error) => {
        const url = (error.config && error.config.url) || '';
        if (error.response && error.response.status === 401 && !url.startsWith('/api/auth/')) {
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            if (window.location.pathname !== '/') window.location.assign('/');
        }
        return Promise.reject(error);
    }
);

export default api;
