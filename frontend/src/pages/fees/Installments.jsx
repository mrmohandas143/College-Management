import { useEffect, useState } from 'react'
import api from '../../api/axios'
import Loader from '../../components/Loader'
import { formatDate, formatCurrency, statusBadge } from '../../utils/helpers'

const empty = { fee: '', installment_number: 1, amount: '', due_date: '', status: 'pending', transaction_id: '' }

export default function Installments() {
  const [list, setList] = useState([])
  const [fees, setFees] = useState([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editItem, setEditItem] = useState(null)
  const [form, setForm] = useState(empty)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [filterFee, setFilterFee] = useState('')

  const load = () => {
    setLoading(true)
    Promise.all([
      api.get('/fees/installments/'),
      api.get('/fees/')
    ]).then(([inst, f]) => {
      setList(inst.data)
      setFees(f.data)
    }).finally(() => setLoading(false))
  }
  useEffect(() => { load() }, [])

  const openAdd = () => { setEditItem(null); setForm(empty); setError(''); setShowModal(true) }
  const openEdit = (item) => { setEditItem(item); setForm({ ...item }); setError(''); setShowModal(true) }
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  const handleSubmit = async (e) => {
    e.preventDefault(); setSaving(true); setError('')
    try {
      if (editItem) await api.put(`/fees/installments/${editItem.id}/`, form)
      else await api.post('/fees/installments/', form)
      setShowModal(false); load()
    } catch (err) {
      const d = err.response?.data
      setError(d ? Object.values(d).flat().join(' ') : 'Failed to save')
    } finally { setSaving(false) }
  }

  const handleMarkPaid = async (item) => {
    await api.put(`/fees/installments/${item.id}/`, {
      ...item, status: 'paid', paid_date: new Date().toISOString().split('T')[0]
    })
    load()
  }

  const handleDelete = async (id) => {
    if (!confirm('Delete this installment?')) return
    await api.delete(`/fees/installments/${id}/`)
    load()
  }

  const filtered = filterFee ? list.filter(i => String(i.fee) === filterFee) : list
  const feeMap = Object.fromEntries(fees.map(f => [f.id, f]))

  const totalPaid = list.filter(i => i.status === 'paid').reduce((s, i) => s + Number(i.amount), 0)
  const totalPending = list.filter(i => i.status !== 'paid').reduce((s, i) => s + Number(i.amount), 0)

  return (
    <div>
      <div className="page-header">
        <div><h1>Installment Payments</h1><p>{list.length} installment records</p></div>
        <button onClick={openAdd} className="btn btn-primary">+ Add Installment</button>
      </div>

      <div className="stats-grid" style={{ marginBottom: 20 }}>
        {[
          { label: 'Total Installments', value: list.length, color: '#2563eb' },
          { label: 'Paid', value: list.filter(i => i.status === 'paid').length, color: '#22c55e' },
          { label: 'Pending', value: list.filter(i => i.status === 'pending').length, color: '#f59e0b' },
          { label: 'Overdue', value: list.filter(i => i.status === 'overdue').length, color: '#ef4444' },
          { label: 'Amount Collected', value: formatCurrency(totalPaid), color: '#22c55e' },
          { label: 'Amount Pending', value: formatCurrency(totalPending), color: '#f59e0b' },
        ].map(k => (
          <div key={k.label} className="stat-card" style={{ borderTop: `3px solid ${k.color}` }}>
            <div className="stat-value" style={{ color: k.color, fontSize: 20 }}>{k.value}</div>
            <div className="stat-label">{k.label}</div>
          </div>
        ))}
      </div>

      <div className="card">
        <div className="toolbar">
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <label className="form-label" style={{ margin: 0 }}>Filter by Fee:</label>
            <select value={filterFee} onChange={e => setFilterFee(e.target.value)}
              style={{ width: 260, padding: '6px 10px' }}>
              <option value="">All Fees</option>
              {fees.map(f => (
                <option key={f.id} value={f.id}>
                  {f.student_name} — {f.fee_type} ({formatCurrency(f.amount)})
                </option>
              ))}
            </select>
          </div>
          <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>{filtered.length} records</span>
        </div>

        {loading ? <Loader /> : filtered.length === 0 ? (
          <div className="empty-state">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" /></svg>
            <p>No installments found.</p>
          </div>
        ) : (
          <div className="table-wrap">
            <table>
              <thead>
                <tr><th>#</th><th>Student / Fee</th><th>Installment</th><th>Amount</th><th>Due Date</th><th>Paid Date</th><th>Status</th><th>Actions</th></tr>
              </thead>
              <tbody>
                {filtered.map((inst, idx) => {
                  const fee = feeMap[inst.fee]
                  return (
                    <tr key={inst.id}>
                      <td style={{ color: 'var(--text-muted)' }}>{idx + 1}</td>
                      <td>
                        <div style={{ fontWeight: 600 }}>{fee?.student_name || `Fee #${inst.fee}`}</div>
                        <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{fee?.fee_type}</div>
                      </td>
                      <td>
                        <span className="badge badge-info">Installment {inst.installment_number}</span>
                      </td>
                      <td style={{ fontWeight: 700 }}>{formatCurrency(inst.amount)}</td>
                      <td>{formatDate(inst.due_date)}</td>
                      <td>{formatDate(inst.paid_date)}</td>
                      <td><span className={`badge ${statusBadge(inst.status)}`}>{inst.status}</span></td>
                      <td>
                        <div className="actions">
                          {inst.status !== 'paid' && (
                            <button onClick={() => handleMarkPaid(inst)} className="btn btn-outline btn-sm" style={{ color: 'var(--success)' }}>✓ Paid</button>
                          )}
                          <button onClick={() => openEdit(inst)} className="btn btn-outline btn-sm">Edit</button>
                          <button onClick={() => handleDelete(inst.id)} className="btn btn-danger btn-sm">Delete</button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {showModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: 16 }}>
          <div style={{ background: '#fff', borderRadius: 12, width: '100%', maxWidth: 500, boxShadow: '0 20px 60px rgba(0,0,0,0.2)' }}>
            <div style={{ padding: '20px 24px', borderBottom: '1px solid #e5e7eb', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ fontWeight: 700, fontSize: 16 }}>{editItem ? 'Edit Installment' : 'Add Installment'}</div>
              <button onClick={() => setShowModal(false)} style={{ background: 'none', border: 'none', fontSize: 20, cursor: 'pointer', color: '#6b7280' }}>✕</button>
            </div>
            <form onSubmit={handleSubmit} style={{ padding: 24 }}>
              {error && <div className="alert alert-error">{error}</div>}
              <div className="form-group">
                <label className="form-label">Fee Record *</label>
                <select value={form.fee} onChange={e => set('fee', e.target.value)} required>
                  <option value="">Select Fee</option>
                  {fees.map(f => (
                    <option key={f.id} value={f.id}>
                      {f.student_name} — {f.fee_type} ({formatCurrency(f.amount)})
                    </option>
                  ))}
                </select>
              </div>
              <div className="form-grid">
                <div className="form-group">
                  <label className="form-label">Installment No. *</label>
                  <input type="number" min="1" value={form.installment_number}
                    onChange={e => set('installment_number', e.target.value)} required />
                </div>
                <div className="form-group">
                  <label className="form-label">Amount (₹) *</label>
                  <input type="number" min="0" step="0.01" value={form.amount}
                    onChange={e => set('amount', e.target.value)} required />
                </div>
                <div className="form-group">
                  <label className="form-label">Due Date *</label>
                  <input type="date" value={form.due_date} onChange={e => set('due_date', e.target.value)} required />
                </div>
                <div className="form-group">
                  <label className="form-label">Status</label>
                  <select value={form.status} onChange={e => set('status', e.target.value)}>
                    <option value="pending">Pending</option>
                    <option value="paid">Paid</option>
                    <option value="overdue">Overdue</option>
                  </select>
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">Transaction ID</label>
                <input value={form.transaction_id} onChange={e => set('transaction_id', e.target.value)} placeholder="Optional" />
              </div>
              <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
                <button type="button" onClick={() => setShowModal(false)} className="btn btn-outline">Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={saving}>
                  {saving ? 'Saving...' : editItem ? 'Update' : 'Add Installment'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
