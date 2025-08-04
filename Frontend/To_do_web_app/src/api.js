import axios from "axios";

// Corrected: Use 'baseURL' instead of 'url'
const api = axios.create({
    baseURL: "https://to-do-app-managemnt-1.onrender.com/",
    headers: {
        "Content-Type": "application/json"
    }
});

api.interceptors.request.use((config) => {
    const token = localStorage.getItem('access_token');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
},
(error) => {
    return Promise.reject(error);
});

export default api;
