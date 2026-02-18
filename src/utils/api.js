import axios from 'axios';

const api = axios.create({ baseURL: '/api' });

// Auth interceptor: attach token to every request
api.interceptors.request.use(config => {
  const token = localStorage.getItem('auth_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Response interceptor: redirect to login on 401
api.interceptors.response.use(res => res, err => {
  if (err.response?.status === 401) {
    localStorage.removeItem('auth_token');
    localStorage.removeItem('auth_user');
    localStorage.removeItem('auth_school');
    window.location.href = '/login.html';
  }
  return Promise.reject(err);
});

// Auth
export const getMe = () => api.get('/auth.php?action=me');
export const logout = () => { api.post('/auth.php?action=logout').catch(()=>{}); localStorage.clear(); window.location.href = '/login.html'; };

export const getReports = () => api.get('/reports.php');
export const addReport = (data) => api.post('/reports.php', data);
export const updateReport = (data) => api.put('/reports.php', data);
export const deleteReport = (id) => api.delete(`/reports.php?id=${id}`);
export const searchReports = (q) => api.get(`/reports.php?search=${encodeURIComponent(q)}`);

export const getSettings = () => api.get('/settings.php');
export const saveSettings = (data) => api.post('/settings.php', data);

export const getStats = () => api.get('/stats.php');
export const resetBudget = (amount) => api.post('/reset_budget.php', { amount });

export const uploadImage = (base64, fileName) => api.post('/upload.php', { base64, fileName });
export const uploadLogo = (base64, fileName) => api.post('/upload_logo.php', { base64, fileName });

export const generatePdf = (data) => api.post('/generate_pdf.php', data);
export const sendLine = (data) => api.post('/send_line.php', data);
export const testLine = (data) => api.post('/test_line.php', data);

// Notifications
export const getNotifications = () => api.get('/notifications.php');
export const markNotificationRead = (id) => api.post('/notifications.php', { id, action: 'read' });
