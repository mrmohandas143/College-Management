export const formatDate = (d) => {
  if (!d) return '—'
  // Parse YYYY-MM-DD directly to avoid timezone shift
  const [year, month, day] = String(d).split('T')[0].split('-')
  if (!year || !month || !day) return '—'
  return new Date(Number(year), Number(month) - 1, Number(day)).toLocaleDateString('en-IN')
}
export const formatCurrency = (n) => `₹${Number(n).toLocaleString('en-IN')}`
export const initials = (first, last) => `${first?.[0] || ''}${last?.[0] || ''}`.toUpperCase()
export const statusBadge = (status) => {
  const map = { active: 'badge-success', inactive: 'badge-gray', paid: 'badge-success', pending: 'badge-warning', overdue: 'badge-danger' }
  return map[status] || 'badge-gray'
}
