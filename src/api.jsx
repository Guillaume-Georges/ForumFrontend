// src/api.js
import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:3000',
  // you can add other defaults here (headers, timeout, etc.)
});

export default api;