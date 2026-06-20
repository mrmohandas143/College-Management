import { useEffect, useState } from 'react'
import api from '../../api/axios'
import Loader from '../../components/Loader'

const empty = { name: '', discount_type: 'percentage', discount_value: '', criteria: '', is_active: true }

export default function Scholarships() {
  const [list, setList] = useState([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editItem, setEditItem] = useState(null)
  const [form, setForm] = useState(empty)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const load = () => {
    setLoading(true)
    api.get('/fees/scholarships/').then(r => setList(r.data)).finally(() => setLoading(false))
  }
  useEffect(() => { load() }, [])

  const openAdd = () => { setEditItem(null); setForm(empty); setError(''); setShowModal(true) }
  const openEdit = (item) => { setEditItem(item); setForm({ ...item }); setError(''); setShowModal(true) }
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  const handleSubmit = async (e) => {
    e.preventDefault(); setSaving(true); setError('')
    try {
      if (editItem) await api.put(`/fees/scholarships/${editItem.id}/`, form)
      else await api.post('/fees/scholarships/', form)
      setShowModal(false); load()
    } catch (err) {
      const d = err.response?.data
      setError(d ? Object.values(d).flat().join(' ') : 'Failed to save')
    } finally { setSaving(false) }
  }

  const handleDelete = async (id) => {
    if (!confirm('Delete this scholarship?')) return
    await api.delete(`/fees/scholarships/${id}/`)
    load()
  }

  const toggleActive = async (item) => {
    await api.put(`/fees/scholarships/${item.id}/`, { ...item, is_active: !item.is_active })
    load()
  }

  return (
    <div>
      <div className="page-header">
        <div><h1>Scholarships & Discounts</h1><p>{list.length} scholarship plans</p></div>
        <button onClick={openAdd} className="btn btn-primary">+ Add Scholarship</button>
      </div>

      {/* Summary */}
      <div className="stats-grid" style={{ marginBottom: 20 }}>
        {[
          { label: 'Total Plans', value: list.length, color: '#2563eb' },
          { label: 'Active', value: list.filter(s => s.is_active).length, color: '#22c55e' },
          { label: 'Percentage Based', value: list.filter(s => s.discount_type === 'percentage').length, color: '#7c3aed' },
          { label: 'Fixed Amount', value: list.filter(s => s.discount_type === 'fixed').length, color: '#d97706' },
        ].map(k => (
          <div key={k.label} className="stat-card" style={{ borderTop: `3px solid ${k.color}` }}>
            <div className="stat-value" style={{ color: k.color }}>{k.value}</div>
            <div className="stat-label">{k.label}</div>
          </div>
        ))}
      </div>

      <div className="card">
        {loading ? <Loader /> : list.length === 0 ? (
          <div className="empty-state">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" /></svg>
            <p>No scholarships yet. Click "+ Add Scholarship" to create one.</p>
          </div>
        ) : (
          <div className="table-wrap">
            <table>
              <thead>
                <tr><th>Name</th><th>Type</th><th>Discount</th><th>Criteria</th><th>Status</th><th>Actions</th></tr>
              </thead>
              <tbody>
                {list.map(s => (
                  <tr key={s.id}>
                    <td style={{ fontWeight: 600 }}>{s.name}</td>
                    <td>
                      <span className={`badge ${s.discount_type === 'percentage' ? 'badge-info' : 'badge-warning'}`}>
                        {s.discount_type === 'percentage' ? '% Percentage' : '₹ Fixed'}
                      </span>
                    </td>
                    <td style={{ fontWeight: 700, color: '#22c55e', fontSize: 15 }}>
                      {s.discount_type === 'percentage' ? `${s.discount_value}%` : `₹${Number(s.discount_value).toLocaleString('en-IN')}`}
                    </td>
                    <td style={{ color: 'var(--text-muted)', maxWidth: 220, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {s.criteria || '—'}
                    </td>
                    <td>
                      <button onClick={() => toggleActive(s)}
                        className={`badge ${s.is_active ? 'badge-success' : 'badge-gray'}`}
                        style={{ border: 'none', cursor: 'pointer' }}>
                        {s.is_active ? 'Active' : 'Inactive'}
                      </button>
                    </td>
                    <td>
                      <div className="actions">
                        <button onClick={() => openEdit(s)} className="btn btn-outline btn-sm">Edit</button>
                        <button onClick={() => handleDelete(s.id)} className="btn btn-danger btn-sm">Delete</button>
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
              <div style={{ fontWeight: 700, fontSize: 16 }}>{editItem ? 'Edit Scholarship' : 'Add Scholarship'}</div>
              <button onClick={() => setShowModal(false)} style={{ background: 'none', border: 'none', fontSize: 20, cursor: 'pointer', color: '#6b7280' }}>✕</button>
            </div>
            <form onSubmit={handleSubmit} style={{ padding: 24 }}>
              {error && <div className="alert alert-error">{error}</div>}
              <div className="form-group">
                <label className="form-label">Scholarship Name *</label>
                <input value={form.name} onChange={e => set('name', e.target.value)} placeholder="e.g. Merit Scholarship" required />
              </div>
              <div className="form-grid">
                <div className="form-group">
                  <label className="form-label">Discount Type *</label>
                  <select value={form.discount_type} onChange={e => set('discount_type', e.target.value)}>
                    <option value="percentage">Percentage (%)</option>
                    <option value="fixed">Fixed Amount (₹)</option>
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">
                    {form.discount_type === 'percentage' ? 'Percentage (%)' : 'Amount (₹)'} *
                  </label>
                  <input type="number" min="0" step="0.01"
                    max={form.discount_type === 'percentage' ? 100 : undefined}
                    value={form.discount_value} onChange={e => set('discount_value', e.target.value)}
                    placeholder={form.discount_type === 'percentage' ? '0–100' : '0.00'} required />
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">Eligibility Criteria</label>
                <textarea rows={2} value={form.criteria} onChange={e => set('criteria', e.target.value)}
                  placeholder="e.g. Students with 90%+ marks in previous semester" />
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
                  {saving ? 'Saving...' : editItem ? 'Update' : 'Add Scholarship'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
