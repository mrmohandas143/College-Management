import { useState, useEffect } from 'react'
import api from '../../api/axios'
import { ENDPOINTS } from '../../api/endpoints'

const badge = (s, map) => <span className={`badge badge-${map[s] || 'secondary'}`}>{s}</span>
const STATUS_COLOR = { pending: 'warning', approved: 'success', rejected: 'danger' }

export default function HostelLeaves() {
  const [leaves, setLeaves]     = useState([])
  const [rooms, setRooms]       = useState([])
  const [loading, setLoading]   = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [filterStatus, setFilterStatus] = useState('')
  const [form, setForm] = useState({ student_name: '', student_id: '', room: '', from_date: '', to_date: '', reason: '' })
  const [students, setStudents] = useState([])

  const load = async (status = filterStatus) => {
    setLoading(true)
    const params = status ? { status } : {}
    const [lRes, rRes, sRes] = await Promise.all([
      api.get(ENDPOINTS.HOSTEL_LEAVES, { params }),
      api.get(ENDPOINTS.HOSTEL_ROOMS),
      api.get(ENDPOINTS.STUDENTS),
    ])
    setLeaves(lRes.data.results ?? lRes.data)
    setRooms(rRes.data.results ?? rRes.data)
    setStudents(sRes.data.results ?? sRes.data)
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  const set = e => setForm(f => ({ ...f, [e.target.name]: e.target.value }))

  const handleSubmit = async (e) => {
    e.preventDefault()
    const { student, ...payload } = form
    await api.post(ENDPOINTS.HOSTEL_LEAVES, payload)
    setShowForm(false)
    setForm({ student_name: '', student_id: '', room: '', from_date: '', to_date: '', reason: '' })
    load()
  }

  const handleAction = async (id, action) => {
    await api.post(`${ENDPOINTS.HOSTEL_LEAVES}${id}/${action}/`)
    load()
  }

  const handleFilter = (s) => { setFilterStatus(s); load(s) }

  const days = (from, to) => {
    if (!from || !to) return 0
    return Math.max(1, Math.round((new Date(to) - new Date(from)) / 86400000) + 1)
  }

  return (
    <div className="page-container">
      <div className="page-header">
        <div>
          <h1 className="page-title">Leave Requests</h1>
          <p className="page-subtitle">Manage student hostel leave applications</p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowForm(true)}>+ Apply Leave</button>
      </div>

      {showForm && (
        <div className="card" style={{ marginBottom: '1rem' }}>
          <div className="card-body">
            <p style={{ fontWeight: 600, marginBottom: '0.75rem' }}>New Leave Application</p>
            <form onSubmit={handleSubmit}>
              <div className="form-grid">
                <div className="form-group">
                  <label className="form-label">Student</label>
                  <select className="form-control" name="student" value={form.student || ''} onChange={e => {
                    const st = students.find(s => s.id === Number(e.target.value))
                    if (st) {
                      setForm(f => ({ ...f, student: st.id, student_name: `${st.first_name} ${st.last_name}`, student_id: st.register_number }))
                    } else {
                      setForm(f => ({ ...f, student: '', student_name: '', student_id: '' }))
                    }
                  }} required>
                    <option value="">Select student</option>
                    {students.map(s => <option key={s.id} value={s.id}>{s.first_name} {s.last_name} ({s.register_number})</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Student Name</label>
                  <input className="form-control" name="student_name" value={form.student_name} readOnly style={{ background: 'var(--bg)' }} required />
                </div>
                <div className="form-group">
                  <label className="form-label">Student ID</label>
                  <input className="form-control" name="student_id" value={form.student_id} readOnly style={{ background: 'var(--bg)' }} />
                </div>
                <div className="form-group">
                  <label className="form-label">Room</label>
                  <select className="form-control" name="room" value={form.room} onChange={set}>
                    <option value="">Select room</option>
                    {rooms.map(r => <option key={r.id} value={r.id}>{r.block_name} — {r.room_number}</option>)}
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
                  <tr><th>Student</th><th>Room</th><th>From</th><th>To</th><th>Days</th><th>Reason</th><th>Status</th><th>Actions</th></tr>
                </thead>
                <tbody>
                  {leaves.length === 0
                    ? <tr><td colSpan={8} style={{ textAlign: 'center' }}>No leave requests</td></tr>
                    : leaves.map(l => (
                      <tr key={l.id}>
                        <td>{l.student_name}</td>
                        <td>{l.room_info || '—'}</td>
                        <td>{l.from_date}</td>
                        <td>{l.to_date}</td>
                        <td>{days(l.from_date, l.to_date)}</td>
                        <td style={{ maxWidth: 180, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{l.reason}</td>
                        <td>{badge(l.status, STATUS_COLOR)}</td>
                        <td>
                          {l.status === 'pending' && (
                            <div style={{ display: 'flex', gap: '0.25rem' }}>
                              <button className="btn btn-sm btn-success" onClick={() => handleAction(l.id, 'approve')}>Approve</button>
                              <button className="btn btn-sm btn-danger"  onClick={() => handleAction(l.id, 'reject')}>Reject</button>
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
