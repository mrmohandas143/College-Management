import api from '../api/axios'
import { ENDPOINTS } from '../api/endpoints'

export const getFees = (params = '') => {
  if (typeof params === 'string') {
    return api.get(`${ENDPOINTS.FEES}${params ? `?search=${params}` : ''}`)
  }
  const query = params?.search ? `?search=${params.search}` : ''
  return api.get(`${ENDPOINTS.FEES}${query}`)
}
export const getFee = (id) => api.get(`${ENDPOINTS.FEES}${id}/`)
export const createFee = (data) => api.post(ENDPOINTS.FEES, data)
export const updateFee = (id, data) => api.put(`${ENDPOINTS.FEES}${id}/`, data)
export const patchFee = (id, data) => api.patch(`${ENDPOINTS.FEES}${id}/`, data)
export const deleteFee = (id) => api.delete(`${ENDPOINTS.FEES}${id}/`)
