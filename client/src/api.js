import axios from 'axios';

// Configure a global axios instance that always includes the httpOnly cookie
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:3001/api',
  withCredentials: true,
});

export default api;
