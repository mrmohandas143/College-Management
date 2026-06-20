import { useState, useEffect } from 'react'
import api from '../../api/axios'
import { ENDPOINTS } from '../../api/endpoints'

export default function HostelVisitors() {
  const [visitors, setVisitors] = useState([])
  const [loading, setLoading]   = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ student_name: '', student_id: '', visitor_name: '', relation: '', contact: '', purpose: '', check_in: '' })

  const load = async () => {
    setLoading(true)
    const res = await api.get(ENDPOINTS.HOSTEL_VISITORS)
    setVisitors(res.data.results ?? res.data)
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  const set = e => setForm(f => ({ ...f, [e.target.name]: e.target.value }))

  const handleSubmit = async (e) => {
    e.preventDefault()
    await api.post(ENDPOINTS.HOSTEL_VISITORS, form)
    setShowForm(false)
    setForm({ student_name: '', student_id: '', visitor_name: '', relation: '', contact: '', purpose: '', check_in: '' })
    load()
  }

  const handleCheckout = async (id) => {
    await api.post(`${ENDPOINTS.HOSTEL_VISITORS}${id}/checkout/`)
    load()
  }

  const fmt = (dt) => dt ? new Date(dt).toLocaleString() : '—'

  return (
    <div className="page-container">
      <div className="page-header">
        <div>
          <h1 className="page-title">Visitor Management</h1>
          <p className="page-subtitle">Log and track hostel visitors</p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowForm(true)}>+ Log Visitor</button>
      </div>

      {showForm && (
        <div className="card" style={{ marginBottom: '1rem' }}>
          <div className="card-body">
            <p style={{ fontWeight: 600, marginBottom: '0.75rem' }}>New Visitor Entry</p>
            <form onSubmit={handleSubmit}>
              <div className="form-grid">
                <div className="form-group">
                  <label className="form-label">Student Name</label>
                  <input className="form-control" name="student_name" value={form.student_name} onChange={set} required />
                </div>
                <div className="form-group">
                  <label className="form-label">Student ID</label>
                  <input className="form-control" name="student_id" value={form.student_id} onChange={set} />
                </div>
                <div className="form-group">
                  <label className="form-label">Visitor Name</label>
                  <input className="form-control" name="visitor_name" value={form.visitor_name} onChange={set} required />
                </div>
                <div className="form-group">
                  <label className="form-label">Relation</label>
                  <input className="form-control" name="relation" value={form.relation} onChange={set} />
                </div>
                <div className="form-group">
                  <label className="form-label">Contact</label>
                  <input className="form-control" name="contact" value={form.contact} onChange={set} />
                </div>
                <div className="form-group">
                  <label className="form-label">Check In</label>
                  <input className="form-control" type="datetime-local" name="check_in" value={form.check_in} onChange={set} required />
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">Purpose</label>
                <input className="form-control" name="purpose" value={form.purpose} onChange={set} />
              </div>
              <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.75rem' }}>
                <button className="btn btn-primary" type="submit">Save</button>
                <button className="btn btn-outline" type="button" onClick={() => setShowForm(false)}>Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className="card">
        <div className="card-body">
          {loading ? <div className="loader" /> : (
            <div className="table-responsive">
              <table className="table">
                <thead>
                  <tr><th>Student</th><th>Visitor</th><th>Relation</th><th>Contact</th><th>Purpose</th><th>Check In</th><th>Check Out</th><th>Actions</th></tr>
                </thead>
                <tbody>
                  {visitors.length === 0
                    ? <tr><td colSpan={8} style={{ textAlign: 'center' }}>No visitor records</td></tr>
                    : visitors.map(v => (
                      <tr key={v.id}>
                        <td>{v.student_name}</td>
                        <td>{v.visitor_name}</td>
                        <td>{v.relation || '—'}</td>
                        <td>{v.contact || '—'}</td>
                        <td style={{ maxWidth: 150, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{v.purpose || '—'}</td>
                        <td>{fmt(v.check_in)}</td>
                        <td>{fmt(v.check_out)}</td>
                        <td>
                          {!v.check_out && (
                            <button className="btn btn-sm btn-warning" onClick={() => handleCheckout(v.id)}>Check Out</button>
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
