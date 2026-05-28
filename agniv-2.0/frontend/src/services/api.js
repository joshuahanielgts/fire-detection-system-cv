import axios from 'axios'

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api',
  headers: { 'Content-Type': 'application/json' },
  withCredentials: true,
})

export default api

export const login = (email, password) => api.post('/login', { email, password })
export const logout = () => api.post('/logout')
export const fetchProperties = () => api.get('/properties')
export const addProperty = (data) => api.post('/properties', data)
export const fetchStatus = () => api.get('/status')
export const startDetection = () => api.post('/start_detection')
export const stopDetection = () => api.post('/stop_detection')
export const getAlerts = (limit = 50) => api.get(`/alerts?limit=${limit}`)
export const clearAlerts = () => api.post('/alerts/clear')
export const detectImage = (imageFile) => {
  const formData = new FormData()
  formData.append('image', imageFile)
  return api.post('/detect_image', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  })
}

export const getLiveStreamUrl = () => {
  const baseURL = import.meta.env.VITE_API_URL || '/api'
  const cleanBase = baseURL.endsWith('/') ? baseURL.slice(0, -1) : baseURL
  return `${cleanBase}/live_detection`
}

