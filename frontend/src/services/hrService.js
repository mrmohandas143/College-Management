import api from '../api/axios'
import { ENDPOINTS } from '../api/endpoints'

// Employees
export const getEmployees = (params = {}) => api.get(ENDPOINTS.HR_EMPLOYEES, { params })
export const getEmployeeById = (id) => api.get(`${ENDPOINTS.HR_EMPLOYEES}${id}/`)
export const createEmployee = (data) => api.post(ENDPOINTS.HR_EMPLOYEES, data)
export const updateEmployee = (id, data) => api.put(`${ENDPOINTS.HR_EMPLOYEES}${id}/`, data)
export const deleteEmployee = (id) => api.delete(`${ENDPOINTS.HR_EMPLOYEES}${id}/`)

// Attendance
export const getAttendance = (params = {}) => api.get(ENDPOINTS.HR_ATTENDANCE, { params })
export const bulkMarkAttendance = (records) => api.post(`${ENDPOINTS.HR_ATTENDANCE}bulk_mark/`, { records })
export const getAttendanceSummary = (params = {}) => api.get(`${ENDPOINTS.HR_ATTENDANCE}summary/`, { params })
export const updateAttendance = (id, data) => api.patch(`${ENDPOINTS.HR_ATTENDANCE}${id}/`, data)

// Leaves
export const getLeaves = (params = {}) => api.get(ENDPOINTS.HR_LEAVES, { params })
export const createLeave = (data) => api.post(ENDPOINTS.HR_LEAVES, data)
export const updateLeave = (id, data) => api.patch(`${ENDPOINTS.HR_LEAVES}${id}/`, data)

// Payroll Config
export const getPayrollConfig = (employeeId) => api.get(ENDPOINTS.HR_PAYROLL_CONFIG, { params: { employee: employeeId } })
export const savePayrollConfig = (data) => data.id
  ? api.put(`${ENDPOINTS.HR_PAYROLL_CONFIG}${data.id}/`, data)
  : api.post(ENDPOINTS.HR_PAYROLL_CONFIG, data)

// Payroll
export const getPayroll = (params = {}) => api.get(ENDPOINTS.HR_PAYROLL, { params })
export const processPayroll = (data) => api.post(`${ENDPOINTS.HR_PAYROLL}process/`, data)
export const markPayrollPaid = (id, paid_on) => api.post(`${ENDPOINTS.HR_PAYROLL}${id}/mark_paid/`, { paid_on })
export const getPayrollAnalytics = (params = {}) => api.get(`${ENDPOINTS.HR_PAYROLL}analytics/`, { params })
export const getPayrollById = (id) => api.get(`${ENDPOINTS.HR_PAYROLL}${id}/`)
