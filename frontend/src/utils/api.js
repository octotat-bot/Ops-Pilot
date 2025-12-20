import axios from 'axios';

const api = axios.create({
    baseURL: import.meta.env.VITE_API_URL || 'https://ops-pilot-backend.vercel.app/api/v1',
    headers: {
        'Content-Type': 'application/json',
    },
});

api.interceptors.request.use(
    (config) => {
        const token = sessionStorage.getItem('token');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => Promise.reject(error)
);

api.interceptors.response.use(
    (response) => response,
    (error) => {

        if (error.response && error.response.status === 401) {

            sessionStorage.removeItem('token');
            sessionStorage.removeItem('user');

        }
        return Promise.reject(error);
    }
);

export default api;
