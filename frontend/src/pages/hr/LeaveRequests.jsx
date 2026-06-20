import { useState, useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { getLeaves, getEmployees, createLeave, updateLeave } from '../../services/hrService'

export default function LeaveRequests() {
  const [leaves, setLeaves] = useState([])
  const [employees, setEmployees] = useState([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [filterStatus, setFilterStatus] = useState('')
  const [form, setForm] = useState({ employee: '', leave_type: 'sick', from_date: '', to_date: '', reason: '' })
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()

  const load = async (status = filterStatus) => {
    setLoading(true)
    try {
      const params = {}
      const empFilter = searchParams.get('employee')
      if (empFilter) params.employee = empFilter
      if (status) params.status = status
      const [lRes, eRes] = await Promise.all([getLeaves(params), getEmployees({ status: 'active' })])
      setLeaves(lRes.data.results ?? lRes.data)
      setEmployees(eRes.data.results ?? eRes.data)
    } finally { setLoading(false) }
  }

  useEffect(() => { load() }, [])

  const set = e => setForm(f => ({ ...f, [e.target.name]: e.target.value }))

  const handleSubmit = async (e) => {
    e.preventDefault()
    await createLeave(form)
    setShowForm(false)
    setForm({ employee: '', leave_type: 'sick', from_date: '', to_date: '', reason: '' })
    load()
  }

  const handleStatus = async (id, status, remarks = '') => {
    await updateLeave(id, { status, remarks })
    load()
  }

  const handleFilter = (s) => { setFilterStatus(s); load(s) }

  const statusColor = { pending: 'warning', approved: 'success', rejected: 'danger' }
  const badge = (s) => <span className={`badge badge-${statusColor[s]}`}>{s}</span>

  const days = (from, to) => {
    if (!from || !to) return 0
    return Math.max(1, Math.round((new Date(to) - new Date(from)) / 86400000) + 1)
  }

  return (
    <div className="page-container">
      <div className="page-header">
        <div>
          <h1 className="page-title">Leave Management</h1>
          <p className="page-subtitle">Apply and manage employee leave requests</p>
        </div>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <button className="btn btn-outline" onClick={() => navigate('/hr/employees')}>← Employees</button>
          <button className="btn btn-primary" onClick={() => setShowForm(true)}>+ Apply Leave</button>
        </div>
      </div>

      {showForm && (
        <div className="card" style={{ marginBottom: '1rem' }}>
          <div className="card-body">
            <p style={{ fontWeight: 600, marginBottom: '0.75rem' }}>New Leave Application</p>
            <form onSubmit={handleSubmit}>
              <div className="form-grid">
                <div className="form-group">
                  <label className="form-label">Employee</label>
                  <select className="form-control" name="employee" value={form.employee} onChange={set} required>
                    <option value="">Select employee</option>
                    {employees.map(e => <option key={e.id} value={e.id}>{e.first_name} {e.last_name}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Leave Type</label>
                  <select className="form-control" name="leave_type" value={form.leave_type} onChange={set}>
                    <option value="sick">Sick</option>
                    <option value="casual">Casual</option>
                    <option value="earned">Earned</option>
                    <option value="unpaid">Unpaid</option>
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">From Date</label>
                  <input className="form-control" type="date" name="from_date" value={form.from_date} onChange={set} required />
                </div>
                <div className="form-group">
                  <label className="form-label">To Date</label>
                  <input className="form-control" type="date" name="to_date" value={form.to_date} onChange={set} required />
                </div>
              </div>
              {form.from_date && form.to_date && (
                <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>
                  Duration: <strong>{days(form.from_date, form.to_date)} day(s)</strong>
                </p>
              )}
              <div className="form-group">
                <label className="form-label">Reason</label>
                <textarea className="form-control" name="reason" value={form.reason} onChange={set} rows={2} required />
              </div>
              <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.75rem' }}>
                <button className="btn btn-primary" type="submit">Submit</button>
                <button className="btn btn-outline" type="button" onClick={() => setShowForm(false)}>Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className="card">
        <div className="card-body">
          <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem' }}>
            {['', 'pending', 'approved', 'rejected'].map(s => (
              <button key={s} className={`btn btn-sm ${filterStatus === s ? 'btn-primary' : 'btn-outline'}`} onClick={() => handleFilter(s)}>
                {s || 'All'}
              </button>
            ))}
          </div>

          {loading ? <div className="loader" /> : (
            <div className="table-responsive">
              <table className="table">
                <thead>
                  <tr><th>Employee</th><th>Type</th><th>From</th><th>To</th><th>Days</th><th>Reason</th><th>Status</th><th>Actions</th></tr>
                </thead>
                <tbody>
                  {leaves.length === 0
                    ? <tr><td colSpan={8} style={{ textAlign: 'center' }}>No leave requests</td></tr>
                    : leaves.map(l => (
                      <tr key={l.id}>
                        <td>{l.employee_name}</td>
                        <td>{l.leave_type}</td>
                        <td>{l.from_date}</td>
                        <td>{l.to_date}</td>
                        <td>{l.days}</td>
                        <td style={{ maxWidth: 180, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{l.reason}</td>
                        <td>{badge(l.status)}</td>
                        <td>
                          {l.status === 'pending' && (
                            <div style={{ display: 'flex', gap: '0.25rem' }}>
                              <button className="btn btn-sm btn-success" onClick={() => handleStatus(l.id, 'approved')}>Approve</button>
                              <button className="btn btn-sm btn-danger" onClick={() => handleStatus(l.id, 'rejected')}>Reject</button>
                            </div>
                          )}
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
