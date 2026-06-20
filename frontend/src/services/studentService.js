import api from '../api/axios'
import { ENDPOINTS } from '../api/endpoints'

export const getStudents = (search = '') => api.get(`${ENDPOINTS.STUDENTS}${search ? `?search=${search}` : ''}`)
export const getStudent = (id) => api.get(`${ENDPOINTS.STUDENTS}${id}/`)
export const createStudent = (data) => api.post(ENDPOINTS.STUDENTS, data, { headers: { 'Content-Type': 'multipart/form-data' } })
export const updateStudent = (id, data) => api.put(`${ENDPOINTS.STUDENTS}${id}/`, data, { headers: { 'Content-Type': 'multipart/form-data' } })
export const deleteStudent = (id) => api.delete(`${ENDPOINTS.STUDENTS}${id}/`)
