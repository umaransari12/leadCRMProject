import axios from 'axios';

// Production builds (Vercel) serve the API from the same origin, so the default base URL is '' and requests use
// relative /api/... paths. Local development defaults to the local backend. REACT_APP_API_URL overrides either default
// when set (an empty value also means same-origin).
const defaultBaseURL = process.env.NODE_ENV === 'production' ? '' : 'http://localhost:5000';
const baseURL = process.env.REACT_APP_API_URL !== undefined ? process.env.REACT_APP_API_URL : defaultBaseURL;

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
