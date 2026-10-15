import axios from 'axios';

export const TOKEN_KEY = 'bp_token';
export const USER_KEY = 'bp_user';

const client = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:8081/api',
  headers: { 'Content-Type': 'application/json' },
});

client.interceptors.request.use((config) => {
  const token = localStorage.getItem('bp_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

client.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      window.dispatchEvent(new CustomEvent('bp:unauthorized'));
    }
    const message =
      err.response?.data?.message ||
      (err.code === 'ERR_NETWORK' ? 'Cannot reach the server. Is the backend running?' : err.message);
    return Promise.reject(new Error(message));
  }
);

export default client;
