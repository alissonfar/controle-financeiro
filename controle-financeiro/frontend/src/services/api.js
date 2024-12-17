import axios from 'axios';

// Configura a URL base do backend
const api = axios.create({
  baseURL: 'http://localhost:3001', // Verifique se o backend está rodando nesta porta
});

export default api;
