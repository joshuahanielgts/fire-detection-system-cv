import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api',
  withCredentials: true,
  timeout: 60000,
  headers: {
    'Content-Type': 'application/json',
  },
});

export const loginUser = async (email, name) => {
  const response = await api.post('/login', { email, name });
  return response.data;
};

export const logoutUser = async () => {
  const response = await api.post('/logout');
  return response.data;
};

export const getProperties = async () => {
  const response = await api.get('/properties');
  return response.data;
};

export const createProperty = async (data) => {
  const response = await api.post('/properties', data);
  return response.data;
};

export const deleteProperty = async (id) => {
  const response = await api.delete(`/properties/${id}`);
  return response.data;
};

export const getHealth = async () => {
  const response = await api.get('/health');
  return response.data;
};

export const startDetection = async () => {
  const response = await api.post('/start_detection');
  return response.data;
};

export const stopDetection = async () => {
  const response = await api.post('/stop_detection');
  return response.data;
};

export const getStatus = async () => {
  const response = await api.get('/status');
  return response.data;
};

export const detectImage = async (file) => {
  const formData = new FormData();
  formData.append('image', file);
  const response = await api.post('/detect_image', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
  return response.data;
};

export const detectFrame = async (base64DataUrl) => {
  const response = await api.post('/detect_frame', { frame: base64DataUrl });
  return response.data;
};

export const getAlerts = async (limit = 50) => {
  const response = await api.get(`/alerts?limit=${limit}`);
  return response.data;
};

export const clearAlerts = async () => {
  const response = await api.post('/alerts/clear');
  return response.data;
};

// --- Compatibility Aliases for Legacy Pages ---
export const fetchProperties = getProperties;
export const fetchStatus = getStatus;
export const addProperty = createProperty;
export const getLiveStreamUrl = () => {
  const baseURL = import.meta.env.VITE_API_URL || '/api';
  const cleanBase = baseURL.endsWith('/') ? baseURL.slice(0, -1) : baseURL;
  return `${cleanBase}/live_detection`;
};

// --- Backend wakeup trigger (Render cold start handling) ---
export const wakeUpBackend = async () => {
  try {
    await api.get('/health', { timeout: 60000 });
    return true;
  } catch {
    return false;
  }
};
