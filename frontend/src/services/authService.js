import api from '../api/axios'
import { ENDPOINTS } from '../api/endpoints'

export const login = (data) => api.post(ENDPOINTS.LOGIN, data)
export const register = (data) => api.post(ENDPOINTS.REGISTER, data)
