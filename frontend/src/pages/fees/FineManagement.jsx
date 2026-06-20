import { useEffect, useState } from 'react'
import api from '../../api/axios'
import Loader from '../../components/Loader'
import { formatCurrency } from '../../utils/helpers'

const emptyRule = { name: '', fine_per_day: '', flat_fine: 0, grace_days: 0, max_fine: '', is_active: true }

export default function FineManagement() {
  const [rules, setRules] = useState([])
  const [fees, setFees] = useState([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editItem, setEditItem] = useState(null)
  const [form, setForm] = useState(emptyRule)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  // Apply fine
  const [applyFeeId, setApplyFeeId] = useState('')
  const [applyRuleId, setApplyRuleId] = useState('')
  const [applyResult, setApplyResult] = useState(null)
  const [applying, setApplying] = useState(false)

  const load = () => {
    setLoading(true)
    Promise.all([
      api.get('/fees/fine-rules/'),
      api.get('/fees/?status=overdue'),
    ]).then(([r, f]) => {
      setRules(r.data)
      setFees(f.data)
    }).finally(() => setLoading(false))
  }
  useEffect(() => { load() }, [])

  const openAdd = () => { setEditItem(null); setForm(emptyRule); setError(''); setShowModal(true) }
  const openEdit = (item) => { setEditItem(item); setForm({ ...item, max_fine: item.max_fine ?? '' }); setError(''); setShowModal(true) }
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  const handleSubmit = async (e) => {
    e.preventDefault(); setSaving(true); setError('')
    try {
      const payload = { ...form, max_fine: form.max_fine || null }
      if (editItem) await api.put(`/fees/fine-rules/${editItem.id}/`, payload)
      else await api.post('/fees/fine-rules/', payload)
      setShowModal(false); load()
    } catch (err) {
      const d = err.response?.data
      setError(d ? Object.values(d).flat().join(' ') : 'Failed to save')
    } finally { setSaving(false) }
  }

  const handleDelete = async (id) => {
    if (!confirm('Delete this fine rule?')) return
    await api.delete(`/fees/fine-rules/${id}/`)
    load()
  }

  const handleApplyFine = async () => {
    if (!applyFeeId || !applyRuleId) return
    setApplying(true); setApplyResult(null)
    try {
      const r = await api.post('/fees/calculate-fine/', { fee_id: applyFeeId, rule_id: applyRuleId })
      setApplyResult({ success: true, ...r.data })
      load()
    } catch {
      setApplyResult({ success: false, message: 'Failed to apply fine' })
    } finally { setApplying(false) }
  }

  return (
    <div>
      <div className="page-header">
        <div><h1>Fine & Penalty Management</h1><p>Configure fine rules and apply penalties</p></div>
        <button onClick={openAdd} className="btn btn-primary">+ Add Fine Rule</button>
      </div>

      {/* Apply Fine Panel */}
      <div className="card" style={{ marginBottom: 24 }}>
        <div className="card-header">
          <h3>⚠️ Apply Fine to Overdue Fee</h3>
          <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>Select an overdue fee and a rule to calculate & apply fine</span>
        </div>
        <div className="card-body">
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr auto', gap: 12, alignItems: 'flex-end' }}>
            <div className="form-group" style={{ margin: 0 }}>
              <label className="form-label">Overdue Fee Record</label>
              <select value={applyFeeId} onChange={e => setApplyFeeId(e.target.value)}>
                <option value="">Select Fee</option>
                {fees.map(f => (
                  <option key={f.id} value={f.id}>
                    {f.student_name} — {f.fee_type} ({formatCurrency(f.net_amount || f.amount)})
                  </option>
                ))}
              </select>
            </div>
            <div className="form-group" style={{ margin: 0 }}>
              <label className="form-label">Fine Rule</label>
              <select value={applyRuleId} onChange={e => setApplyRuleId(e.target.value)}>
                <option value="">Select Rule</option>
                {rules.filter(r => r.is_active).map(r => (
                  <option key={r.id} value={r.id}>{r.name}</option>
                ))}
              </select>
            </div>
            <button onClick={handleApplyFine} className="btn btn-primary"
              disabled={applying || !applyFeeId || !applyRuleId} style={{ height: 38 }}>
              {applying ? 'Applying...' : 'Apply Fine'}
            </button>
          </div>
          {applyResult && (
            <div className={`alert ${applyResult.success ? 'alert-success' : 'alert-error'}`} style={{ marginTop: 12, marginBottom: 0 }}>
              {applyResult.message}
              {applyResult.fine > 0 && ` — Fine: ${formatCurrency(applyResult.fine)} (${applyResult.days_overdue} days overdue)`}
            </div>
          )}
        </div>
      </div>

      {/* Fine Rules Table */}
      <div className="card">
        <div className="card-header">
          <h3>📋 Fine Rules</h3>
          <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>{rules.length} rules configured</span>
        </div>
        {loading ? <Loader /> : rules.length === 0 ? (
          <div className="empty-state">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z M12 9v4 M12 17h.01" /></svg>
            <p>No fine rules configured yet.</p>
          </div>
        ) : (
          <div className="table-wrap">
            <table>
              <thead>
                <tr><th>Rule Name</th><th>Per Day Fine</th><th>Flat Fine</th><th>Grace Days</th><th>Max Fine</th><th>Status</th><th>Actions</th></tr>
              </thead>
              <tbody>
                {rules.map(r => (
                  <tr key={r.id}>
                    <td style={{ fontWeight: 600 }}>{r.name}</td>
                    <td style={{ color: '#dc2626', fontWeight: 600 }}>{formatCurrency(r.fine_per_day)}/day</td>
                    <td>{formatCurrency(r.flat_fine)}</td>
                    <td>
                      <span className="badge badge-info">{r.grace_days} days</span>
                    </td>
                    <td>{r.max_fine ? formatCurrency(r.max_fine) : <span style={{ color: 'var(--text-muted)' }}>No limit</span>}</td>
                    <td><span className={`badge ${r.is_active ? 'badge-success' : 'badge-gray'}`}>{r.is_active ? 'Active' : 'Inactive'}</span></td>
                    <td>
                      <div className="actions">
                        <button onClick={() => openEdit(r)} className="btn btn-outline btn-sm">Edit</button>
                        <button onClick={() => handleDelete(r.id)} className="btn btn-danger btn-sm">Delete</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {showModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: 16 }}>
          <div style={{ background: '#fff', borderRadius: 12, width: '100%', maxWidth: 480, boxShadow: '0 20px 60px rgba(0,0,0,0.2)' }}>
            <div style={{ padding: '20px 24px', borderBottom: '1px solid #e5e7eb', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ fontWeight: 700, fontSize: 16 }}>{editItem ? 'Edit Fine Rule' : 'Add Fine Rule'}</div>
              <button onClick={() => setShowModal(false)} style={{ background: 'none', border: 'none', fontSize: 20, cursor: 'pointer', color: '#6b7280' }}>✕</button>
            </div>
            <form onSubmit={handleSubmit} style={{ padding: 24 }}>
              {error && <div className="alert alert-error">{error}</div>}
              <div className="form-group">
                <label className="form-label">Rule Name *</label>
                <input value={form.name} onChange={e => set('name', e.target.value)} placeholder="e.g. Standard Late Fee" required />
              </div>
              <div className="form-grid">
                <div className="form-group">
                  <label className="form-label">Fine Per Day (₹)</label>
                  <input type="number" min="0" step="0.01" value={form.fine_per_day}
                    onChange={e => set('fine_per_day', e.target.value)} placeholder="0.00" />
                </div>
                <div className="form-group">
                  <label className="form-label">Flat Fine (₹)</label>
                  <input type="number" min="0" step="0.01" value={form.flat_fine}
                    onChange={e => set('flat_fine', e.target.value)} placeholder="0.00" />
                </div>
                <div className="form-group">
                  <label className="form-label">Grace Days</label>
                  <input type="number" min="0" value={form.grace_days}
                    onChange={e => set('grace_days', e.target.value)} placeholder="0" />
                </div>
                <div className="form-group">
                  <label className="form-label">Max Fine (₹)</label>
                  <input type="number" min="0" step="0.01" value={form.max_fine}
                    onChange={e => set('max_fine', e.target.value)} placeholder="Leave blank for no limit" />
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">Status</label>
                <select value={form.is_active} onChange={e => set('is_active', e.target.value === 'true')}>
                  <option value="true">Active</option>
                  <option value="false">Inactive</option>
                </select>
              </div>
              <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
                <button type="button" onClick={() => setShowModal(false)} className="btn btn-outline">Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={saving}>
                  {saving ? 'Saving...' : editItem ? 'Update' : 'Add Rule'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
