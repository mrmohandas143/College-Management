import { useState, useEffect } from 'react'
import api from '../../api/axios'
import { ENDPOINTS } from '../../api/endpoints'

const badge = (s, map) => <span className={`badge badge-${map[s] || 'secondary'}`}>{s}</span>

export default function HostelAllotments() {
  const [allotments, setAllotments] = useState([])
  const [rooms, setRooms]           = useState([])
  const [loading, setLoading]       = useState(true)
  const [showForm, setShowForm]     = useState(false)
  const [filterStatus, setFilterStatus] = useState('active')
  const [form, setForm] = useState({ room: '', student_name: '', student_id: '', contact: '', allotment_date: new Date().toISOString().split('T')[0] })
  const [students, setStudents]     = useState([])

  const load = async (status = filterStatus) => {
    setLoading(true)
    const params = status ? { status } : {}
    const [aRes, rRes, sRes] = await Promise.all([
      api.get(ENDPOINTS.HOSTEL_ALLOTMENTS, { params }),
      api.get(ENDPOINTS.HOSTEL_ROOMS),
      api.get(ENDPOINTS.STUDENTS),
    ])
    setAllotments(aRes.data.results ?? aRes.data)
    setRooms(rRes.data.results ?? rRes.data)
    setStudents(sRes.data.results ?? sRes.data)
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  const set = e => setForm(f => ({ ...f, [e.target.name]: e.target.value }))

  const handleSubmit = async (e) => {
    e.preventDefault()
    const { student, ...payload } = form
    await api.post(ENDPOINTS.HOSTEL_ALLOTMENTS, payload)
    setShowForm(false)
    setForm({ room: '', student_name: '', student_id: '', contact: '', allotment_date: new Date().toISOString().split('T')[0] })
    load()
  }

  const handleVacate = async (id) => {
    if (!confirm('Mark this student as vacated?')) return
    await api.post(`${ENDPOINTS.HOSTEL_ALLOTMENTS}${id}/vacate/`)
    load()
  }

  const handleFilter = (s) => { setFilterStatus(s); load(s) }

  return (
    <div className="page-container">
      <div className="page-header">
        <div>
          <h1 className="page-title">Room Allotments</h1>
          <p className="page-subtitle">Assign rooms and manage student check-in / check-out</p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowForm(true)}>+ Allot Room</button>
      </div>

      {showForm && (
        <div className="card" style={{ marginBottom: '1rem' }}>
          <div className="card-body">
            <p style={{ fontWeight: 600, marginBottom: '0.75rem' }}>New Room Allotment</p>
            <form onSubmit={handleSubmit}>
              <div className="form-grid">
                <div className="form-group">
                  <label className="form-label">Room</label>
                  <select className="form-control" name="room" value={form.room} onChange={set} required>
                    <option value="">Select room</option>
                    {rooms.filter(r => r.status === 'available').map(r => (
                      <option key={r.id} value={r.id}>{r.block_name} — {r.room_number}</option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Student</label>
                  <select className="form-control" name="student" value={form.student || ''} onChange={e => {
                    const st = students.find(s => s.id === Number(e.target.value))
                    if (st) {
                      setForm(f => ({ ...f, student: st.id, student_name: `${st.first_name} ${st.last_name}`, student_id: st.register_number, contact: st.phone || '' }))
                    } else {
                      setForm(f => ({ ...f, student: '', student_name: '', student_id: '', contact: '' }))
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
                  <label className="form-label">Allotment Date</label>
                  <input className="form-control" type="date" name="allotment_date" value={form.allotment_date} onChange={set} required />
                </div>
              </div>
              <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.75rem' }}>
                <button className="btn btn-primary" type="submit">Allot</button>
                <button className="btn btn-outline" type="button" onClick={() => setShowForm(false)}>Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className="card">
        <div className="card-body">
          <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem' }}>
            {['', 'active', 'vacated'].map(s => (
              <button key={s} className={`btn btn-sm ${filterStatus === s ? 'btn-primary' : 'btn-outline'}`} onClick={() => handleFilter(s)}>
                {s || 'All'}
              </button>
            ))}
          </div>

          {loading ? <div className="loader" /> : (
            <div className="table-responsive">
              <table className="table">
                <thead>
                  <tr><th>Student</th><th>Room</th><th>Contact</th><th>Allotment Date</th><th>Vacating Date</th><th>Status</th><th>Actions</th></tr>
                </thead>
                <tbody>
                  {allotments.length === 0
                    ? <tr><td colSpan={7} style={{ textAlign: 'center' }}>No allotments</td></tr>
                    : allotments.map(a => (
                      <tr key={a.id}>
                        <td>{a.student_name}</td>
                        <td>{a.room_info}</td>
                        <td>{a.contact || '—'}</td>
                        <td>{a.allotment_date}</td>
                        <td>{a.vacating_date || '—'}</td>
                        <td>{badge(a.status, { active: 'success', vacated: 'secondary' })}</td>
                        <td>
                          {a.status === 'active' && (
                            <button className="btn btn-sm btn-danger" onClick={() => handleVacate(a.id)}>Check-Out</button>
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
