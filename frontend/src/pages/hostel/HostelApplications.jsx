import { useState, useEffect } from 'react'
import api from '../../api/axios'
import { ENDPOINTS } from '../../api/endpoints'

const badge = (s, map) => <span className={`badge badge-${map[s] || 'secondary'}`}>{s}</span>
const STATUS_COLOR = { pending: 'warning', approved: 'success', rejected: 'danger' }

export default function HostelApplications() {
  const [applications, setApplications] = useState([])
  const [blocks, setBlocks]             = useState([])
  const [loading, setLoading]           = useState(true)
  const [showForm, setShowForm]         = useState(false)
  const [filterStatus, setFilterStatus] = useState('')
  const [form, setForm] = useState({ student_name: '', student_id: '', contact: '', gender: 'male', preferred_block: '', reason: '' })
  const [students, setStudents]         = useState([])

  const load = async (status = filterStatus) => {
    setLoading(true)
    const params = status ? { status } : {}
    const [aRes, bRes, sRes] = await Promise.all([
      api.get(ENDPOINTS.HOSTEL_APPLICATIONS, { params }),
      api.get(ENDPOINTS.HOSTEL_BLOCKS),
      api.get(ENDPOINTS.STUDENTS),
    ])
    setApplications(aRes.data.results ?? aRes.data)
    setBlocks(bRes.data.results ?? bRes.data)
    setStudents(sRes.data.results ?? sRes.data)
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  const set = e => setForm(f => ({ ...f, [e.target.name]: e.target.value }))

  const handleSubmit = async (e) => {
    e.preventDefault()
    const { student, ...payload } = form
    await api.post(ENDPOINTS.HOSTEL_APPLICATIONS, payload)
    setShowForm(false)
    setForm({ student_name: '', student_id: '', contact: '', gender: 'male', preferred_block: '', reason: '' })
    load()
  }

  const handleAction = async (id, action) => {
    await api.post(`${ENDPOINTS.HOSTEL_APPLICATIONS}${id}/${action}/`)
    load()
  }

  const handleFilter = (s) => { setFilterStatus(s); load(s) }

  return (
    <div className="page-container">
      <div className="page-header">
        <div>
          <h1 className="page-title">Hostel Applications</h1>
          <p className="page-subtitle">Student applications for hostel admission</p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowForm(true)}>+ New Application</button>
      </div>

      {showForm && (
        <div className="card" style={{ marginBottom: '1rem' }}>
          <div className="card-body">
            <p style={{ fontWeight: 600, marginBottom: '0.75rem' }}>New Hostel Application</p>
            <form onSubmit={handleSubmit}>
              <div className="form-grid">
                <div className="form-group">
                  <label className="form-label">Student</label>
                  <select className="form-control" name="student" value={form.student || ''} onChange={e => {
                    const st = students.find(s => s.id === Number(e.target.value))
                    if (st) {
                      setForm(f => ({ ...f, student: st.id, student_name: `${st.first_name} ${st.last_name}`, student_id: st.register_number, contact: st.phone || '', gender: st.gender || 'male' }))
                    } else {
                      setForm(f => ({ ...f, student: '', student_name: '', student_id: '', contact: '', gender: 'male' }))
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
                  <label className="form-label">Contact</label>
                  <input className="form-control" name="contact" value={form.contact} onChange={set} />
                </div>
                <div className="form-group">
                  <label className="form-label">Gender</label>
                  <select className="form-control" name="gender" value={form.gender} onChange={set}>
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Preferred Block</label>
                  <select className="form-control" name="preferred_block" value={form.preferred_block} onChange={set}>
                    <option value="">No preference</option>
                    {blocks.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
                  </select>
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">Reason</label>
                <textarea className="form-control" name="reason" value={form.reason} onChange={set} rows={2} />
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
                  <tr><th>Student</th><th>ID</th><th>Gender</th><th>Preferred Block</th><th>Applied On</th><th>Status</th><th>Actions</th></tr>
                </thead>
                <tbody>
                  {applications.length === 0
                    ? <tr><td colSpan={7} style={{ textAlign: 'center' }}>No applications</td></tr>
                    : applications.map(a => (
                      <tr key={a.id}>
                        <td>{a.student_name}</td>
                        <td>{a.student_id || '—'}</td>
                        <td>{a.gender}</td>
                        <td>{a.preferred_block_name || '—'}</td>
                        <td>{new Date(a.applied_on).toLocaleDateString()}</td>
                        <td>{badge(a.status, STATUS_COLOR)}</td>
                        <td>
                          {a.status === 'pending' && (
                            <div style={{ display: 'flex', gap: '0.25rem' }}>
                              <button className="btn btn-sm btn-success" onClick={() => handleAction(a.id, 'approve')}>Approve</button>
                              <button className="btn btn-sm btn-danger"  onClick={() => handleAction(a.id, 'reject')}>Reject</button>
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
