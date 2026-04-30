import axios from 'axios';
const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';
const api = axios.create({ baseURL: BASE_URL });
api.interceptors.request.use(config => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});
export const login = (username, password) => api.post('/api/auth/login', { username, password }).then(r => r.data);
export const getUsers = () => api.get('/api/auth/users').then(r => r.data);
export const getDocuments = () => api.get('/api/documents').then(r => r.data);
export const getDocument = (id) => api.get(`/api/documents/${id}`).then(r => r.data);
export const createDocument = (title, content = '') => api.post('/api/documents', { title, content }).then(r => r.data);
export const updateDocument = (id, updates) => api.patch(`/api/documents/${id}`, updates).then(r => r.data);
export const deleteDocument = (id) => api.delete(`/api/documents/${id}`).then(r => r.data);
export const shareDocument = (id, username) => api.post(`/api/documents/${id}/share`, { username }).then(r => r.data);
export const revokeAccess = (docId, userId) => api.delete(`/api/documents/${docId}/share/${userId}`).then(r => r.data);
export const getVersions = (docId) => api.get(`/api/documents/${docId}/versions`).then(r => r.data);
export const saveVersion = (docId) => api.post(`/api/documents/${docId}/versions`).then(r => r.data);
export const registerPresence = (docId) => api.post(`/api/presence/${docId}`).then(r => r.data);
export const getPresence = (docId) => api.get(`/api/presence/${docId}`).then(r => r.data);
export const leavePresence = (docId) => api.delete(`/api/presence/${docId}`).then(r => r.data);
export const uploadFile = (file) => {
  const formData = new FormData();
  formData.append('file', file);
  return api.post('/api/upload', formData, { headers: { 'Content-Type': 'multipart/form-data' } }).then(r => r.data);
};
export default api;
