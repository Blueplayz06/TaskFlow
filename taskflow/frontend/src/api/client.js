import axios from 'axios';

const client = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:4000/api',
  headers: { 'Content-Type': 'application/json' },
});

// Attach JWT token to every request
client.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Auto-logout on 401
client.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    return Promise.reject(err);
  }
);

export default client;

// ── Auth
export const login = (data) => client.post('/auth/login', data);
export const register = (data) => client.post('/auth/register', data);
export const getMe = () => client.get('/auth/me');

// ── Tasks
export const getTasks = (projectId) => client.get(`/tasks?project_id=${projectId}`);
export const createTask = (data) => client.post('/tasks', data);
export const updateTask = (id, data) => client.put(`/tasks/${id}`, data);
export const deleteTask = (id) => client.delete(`/tasks/${id}`);
export const reorderTask = (id, data) => client.patch(`/tasks/${id}/reorder`, data);

// ── Projects
export const getProjects = () => client.get('/projects');
export const createProject = (data) => client.post('/projects', data);
