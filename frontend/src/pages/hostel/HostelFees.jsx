import { useState, useEffect } from 'react'
import api from '../../api/axios'
import { ENDPOINTS } from '../../api/endpoints'

const badge = (s, map) => <span className={`badge badge-${map[s] || 'secondary'}`}>{s}</span>
const STATUS_COLOR = { paid: 'success', pending: 'warning', overdue: 'danger' }

export default function HostelFees() {
  const [fees, setFees]         = useState([])
  const [allotments, setAllotments] = useState([])
  const [loading, setLoading]   = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [filterStatus, setFilterStatus] = useState('')
  const [form, setForm] = useState({ allotment: '', month: '', amount: '', due_date: '', remarks: '' })

  const load = async (status = filterStatus) => {
    setLoading(true)
    const params = status ? { status } : {}
    const [fRes, aRes] = await Promise.all([
      api.get(ENDPOINTS.HOSTEL_FEES, { params }),
      api.get(ENDPOINTS.HOSTEL_ALLOTMENTS, { params: { status: 'active' } }),
    ])
    setFees(fRes.data.results ?? fRes.data)
    setAllotments(aRes.data.results ?? aRes.data)
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  const set = e => setForm(f => ({ ...f, [e.target.name]: e.target.value }))

  const handleSubmit = async (e) => {
    e.preventDefault()
    await api.post(ENDPOINTS.HOSTEL_FEES, form)
    setShowForm(false)
    setForm({ allotment: '', month: '', amount: '', due_date: '', remarks: '' })
    load()
  }

  const handleMarkPaid = async (id) => {
    await api.post(`${ENDPOINTS.HOSTEL_FEES}${id}/mark_paid/`)
    load()
  }

  const handleFilter = (s) => { setFilterStatus(s); load(s) }

  return (
    <div className="page-container">
      <div className="page-header">
        <div>
          <h1 className="page-title">Hostel Fees</h1>
          <p className="page-subtitle">Manage hostel fee collection and payment status</p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowForm(true)}>+ Add Fee</button>
      </div>

      {showForm && (
        <div className="card" style={{ marginBottom: '1rem' }}>
          <div className="card-body">
            <p style={{ fontWeight: 600, marginBottom: '0.75rem' }}>New Fee Entry</p>
            <form onSubmit={handleSubmit}>
              <div className="form-grid">
                <div className="form-group">
                  <label className="form-label">Student (Allotment)</label>
                  <select className="form-control" name="allotment" value={form.allotment} onChange={set} required>
                    <option value="">Select student</option>
                    {allotments.map(a => <option key={a.id} value={a.id}>{a.student_name} — {a.room_info}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Month</label>
                  <input className="form-control" name="month" placeholder="e.g. June 2025" value={form.month} onChange={set} required />
                </div>
                <div className="form-group">
                  <label className="form-label">Amount</label>
                  <input className="form-control" type="number" name="amount" value={form.amount} onChange={set} required />
                </div>
                <div className="form-group">
                  <label className="form-label">Due Date</label>
                  <input className="form-control" type="date" name="due_date" value={form.due_date} onChange={set} required />
                </div>
                <div className="form-group">
                  <label className="form-label">Remarks</label>
                  <input className="form-control" name="remarks" value={form.remarks} onChange={set} />
                </div>
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
          <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem' }}>
            {['', 'pending', 'paid', 'overdue'].map(s => (
              <button key={s} className={`btn btn-sm ${filterStatus === s ? 'btn-primary' : 'btn-outline'}`} onClick={() => handleFilter(s)}>
                {s || 'All'}
              </button>
            ))}
          </div>

          {loading ? <div className="loader" /> : (
            <div className="table-responsive">
              <table className="table">
                <thead>
                  <tr><th>Student</th><th>Room</th><th>Month</th><th>Amount</th><th>Due Date</th><th>Paid Date</th><th>Status</th><th>Actions</th></tr>
                </thead>
                <tbody>
                  {fees.length === 0
                    ? <tr><td colSpan={8} style={{ textAlign: 'center' }}>No fee records</td></tr>
                    : fees.map(f => (
                      <tr key={f.id}>
                        <td>{f.student_name}</td>
                        <td>{f.room_info}</td>
                        <td>{f.month}</td>
                        <td>₹{Number(f.amount).toLocaleString('en-IN')}</td>
                        <td>{f.due_date}</td>
                        <td>{f.paid_date || '—'}</td>
                        <td>{badge(f.status, STATUS_COLOR)}</td>
                        <td>
                          {f.status !== 'paid' && (
                            <button className="btn btn-sm btn-success" onClick={() => handleMarkPaid(f.id)}>Mark Paid</button>
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
