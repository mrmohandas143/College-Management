import { useState, useEffect } from 'react'
import api from '../../api/axios'
import { ENDPOINTS } from '../../api/endpoints'

const badge = (s, map) => <span className={`badge badge-${map[s] || 'secondary'}`}>{s?.replace('_', ' ')}</span>
const STATUS_COLOR = { open: 'danger', in_progress: 'warning', resolved: 'success' }

export default function HostelComplaints() {
  const [complaints, setComplaints] = useState([])
  const [rooms, setRooms]           = useState([])
  const [loading, setLoading]       = useState(true)
  const [showForm, setShowForm]     = useState(false)
  const [filterStatus, setFilterStatus] = useState('')
  const [form, setForm] = useState({ student_name: '', room: '', complaint: '' })

  const load = async (status = filterStatus) => {
    setLoading(true)
    const params = status ? { status } : {}
    const [cRes, rRes] = await Promise.all([
      api.get(ENDPOINTS.HOSTEL_COMPLAINTS, { params }),
      api.get(ENDPOINTS.HOSTEL_ROOMS),
    ])
    setComplaints(cRes.data.results ?? cRes.data)
    setRooms(rRes.data.results ?? rRes.data)
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  const set = e => setForm(f => ({ ...f, [e.target.name]: e.target.value }))

  const handleSubmit = async (e) => {
    e.preventDefault()
    await api.post(ENDPOINTS.HOSTEL_COMPLAINTS, form)
    setShowForm(false)
    setForm({ student_name: '', room: '', complaint: '' })
    load()
  }

  const handleStatus = async (id, status) => {
    await api.patch(`${ENDPOINTS.HOSTEL_COMPLAINTS}${id}/`, { status })
    load()
  }

  const handleFilter = (s) => { setFilterStatus(s); load(s) }

  return (
    <div className="page-container">
      <div className="page-header">
        <div>
          <h1 className="page-title">Complaints</h1>
          <p className="page-subtitle">Track and resolve student hostel complaints</p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowForm(true)}>+ File Complaint</button>
      </div>

      {showForm && (
        <div className="card" style={{ marginBottom: '1rem' }}>
          <div className="card-body">
            <p style={{ fontWeight: 600, marginBottom: '0.75rem' }}>New Complaint</p>
            <form onSubmit={handleSubmit}>
              <div className="form-grid">
                <div className="form-group">
                  <label className="form-label">Student Name</label>
                  <input className="form-control" name="student_name" value={form.student_name} onChange={set} required />
                </div>
                <div className="form-group">
                  <label className="form-label">Room</label>
                  <select className="form-control" name="room" value={form.room} onChange={set}>
                    <option value="">Select room</option>
                    {rooms.map(r => <option key={r.id} value={r.id}>{r.block_name} — {r.room_number}</option>)}
                  </select>
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">Complaint</label>
                <textarea className="form-control" name="complaint" value={form.complaint} onChange={set} rows={3} required />
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
            {['', 'open', 'in_progress', 'resolved'].map(s => (
              <button key={s} className={`btn btn-sm ${filterStatus === s ? 'btn-primary' : 'btn-outline'}`} onClick={() => handleFilter(s)}>
                {s ? s.replace('_', ' ') : 'All'}
              </button>
            ))}
          </div>

          {loading ? <div className="loader" /> : (
            <div className="table-responsive">
              <table className="table">
                <thead>
                  <tr><th>Student</th><th>Complaint</th><th>Filed On</th><th>Status</th><th>Actions</th></tr>
                </thead>
                <tbody>
                  {complaints.length === 0
                    ? <tr><td colSpan={5} style={{ textAlign: 'center' }}>No complaints</td></tr>
                    : complaints.map(c => (
                      <tr key={c.id}>
                        <td>{c.student_name}</td>
                        <td style={{ maxWidth: 280, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{c.complaint}</td>
                        <td>{new Date(c.filed_on).toLocaleDateString()}</td>
                        <td>{badge(c.status, STATUS_COLOR)}</td>
                        <td style={{ display: 'flex', gap: '0.25rem' }}>
                          {c.status === 'open' && (
                            <button className="btn btn-sm btn-warning" onClick={() => handleStatus(c.id, 'in_progress')}>In Progress</button>
                          )}
                          {c.status !== 'resolved' && (
                            <button className="btn btn-sm btn-success" onClick={() => handleStatus(c.id, 'resolved')}>Resolve</button>
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
