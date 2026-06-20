import api from '../api/axios'
import { ENDPOINTS } from '../api/endpoints'

export const getFaculty = (search = '') => api.get(`${ENDPOINTS.FACULTY}${search ? `?search=${search}` : ''}`)
export const getFacultyById = (id) => api.get(`${ENDPOINTS.FACULTY}${id}/`)
export const createFaculty = (data) => api.post(ENDPOINTS.FACULTY, data)
export const updateFaculty = (id, data) => api.put(`${ENDPOINTS.FACULTY}${id}/`, data)
export const deleteFaculty = (id) => api.delete(`${ENDPOINTS.FACULTY}${id}/`)
