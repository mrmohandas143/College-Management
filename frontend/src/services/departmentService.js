import api from '../api/axios'
import { ENDPOINTS } from '../api/endpoints'

export const getDepartments = (search = '') => api.get(`${ENDPOINTS.DEPARTMENTS}${search ? `?search=${search}` : ''}`)
export const getDepartment = (id) => api.get(`${ENDPOINTS.DEPARTMENTS}${id}/`)
export const createDepartment = (data) => api.post(ENDPOINTS.DEPARTMENTS, data)
export const updateDepartment = (id, data) => api.put(`${ENDPOINTS.DEPARTMENTS}${id}/`, data)
export const deleteDepartment = (id) => api.delete(`${ENDPOINTS.DEPARTMENTS}${id}/`)
