import { useEffect, useState } from 'react'
import api from '../../api/axios'
import Loader from '../../components/Loader'
import { formatCurrency } from '../../utils/helpers'

const FEE_STRUCTURE_TYPES = [
  { key: 'tuition',   label: 'Tuition Fee',   color: '#2563eb', bg: '#eff6ff' },
  { key: 'exam',      label: 'Exam Fee',       color: '#7c3aed', bg: '#f5f3ff' },
  { key: 'library',   label: 'Library Fee',    color: '#059669', bg: '#ecfdf5' },
  { key: 'transport', label: 'Transport Fee',  color: '#d97706', bg: '#fffbeb' },
  { key: 'lab',       label: 'Lab Fee',        color: '#0891b2', bg: '#ecfeff' },
  { key: 'hostel',    label: 'Hostel Fee',     color: '#dc2626', bg: '#fef2f2' },
  { key: 'sports',    label: 'Sports Fee',     color: '#16a34a', bg: '#f0fdf4' },
  { key: 'other',     label: 'Other',          color: '#6b7280', bg: '#f9fafb' },
]

const COURSES = ['B.Tech', 'M.Tech', 'BCA', 'MCA', 'B.Sc', 'M.Sc', 'B.Com', 'M.Com', 'BBA', 'MBA']
const SEMESTERS = [1, 2, 3, 4, 5, 6, 7, 8]

// Default amounts per course per fee type
const COURSE_FEE_DEFAULTS = {
  'B.Tech':  { tuition: 50000, exam: 2000, library: 1500, transport: 8000, lab: 5000, hostel: 40000, sports: 2000, other: 1000 },
  'M.Tech':  { tuition: 60000, exam: 2500, library: 2000, transport: 8000, lab: 6000, hostel: 42000, sports: 2000, other: 1000 },
  'BCA':     { tuition: 40000, exam: 1500, library: 1000, transport: 7000, lab: 3000, hostel: 35000, sports: 1500, other: 1000 },
  'MCA':     { tuition: 45000, exam: 2000, library: 1500, transport: 7000, lab: 4000, hostel: 38000, sports: 1500, other: 1000 },
  'B.Sc':    { tuition: 35000, exam: 1500, library: 1000, transport: 6000, lab: 3000, hostel: 32000, sports: 1500, other: 1000 },
  'M.Sc':    { tuition: 40000, exam: 2000, library: 1500, transport: 6000, lab: 4000, hostel: 35000, sports: 1500, other: 1000 },
  'B.Com':   { tuition: 30000, exam: 1500, library: 1000, transport: 6000, lab: 1000, hostel: 30000, sports: 1500, other: 1000 },
  'M.Com':   { tuition: 35000, exam: 2000, library: 1500, transport: 6000, lab: 1000, hostel: 32000, sports: 1500, other: 1000 },
  'BBA':     { tuition: 45000, exam: 2000, library: 1500, transport: 7000, lab: 1000, hostel: 38000, sports: 2000, other: 1000 },
  'MBA':     { tuition: 70000, exam: 3000, library: 2500, transport: 9000, lab: 2000, hostel: 50000, sports: 2500, other: 1500 },
}

const emptyForm = {
  name: '', fee_type: 'tuition', amount: '', course: '',
  department: '', semester: '', academic_year: '2024-25',
  is_active: true, description: '',
}

export default function FeeStructure() {
  const [structures, setStructures] = useState([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editItem, setEditItem] = useState(null)
  const [form, setForm] = useState(emptyForm)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [activeType, setActiveType] = useState('all')
  const [search, setSearch] = useState('')
  const [autoFilled, setAutoFilled] = useState(false)
  const [viewCourse, setViewCourse] = useState('B.Tech')

  const load = () => {
    setLoading(true)
    api.get('/fees/structures/').then(r => setStructures(r.data)).finally(() => setLoading(false))
  }

  useEffect(() => { load() }, [])

  const openAdd = () => {
    setEditItem(null)
    setForm(emptyForm)
    setError('')
    setAutoFilled(false)
    setShowModal(true)
  }

  const openEdit = (item) => {
    setEditItem(item)
    setForm({ ...item, semester: item.semester ?? '' })
    setError('')
    setAutoFilled(false)
    setShowModal(true)
  }

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  // Auto-fill amount when course OR fee_type changes
  const handleCourseChange = (course) => {
    set('course', course)
    if (course && COURSE_FEE_DEFAULTS[course] && form.fee_type) {
      const defaultAmt = COURSE_FEE_DEFAULTS[course][form.fee_type]
      if (defaultAmt) {
        set('amount', defaultAmt)
        setAutoFilled(true)
      }
    } else {
      setAutoFilled(false)
    }
    // Auto-generate name
    if (course && form.fee_type) {
      const typeLabel = FEE_STRUCTURE_TYPES.find(t => t.key === form.fee_type)?.label || ''
      set('name', `${course} ${typeLabel}${form.semester ? ` Sem ${form.semester}` : ''}`)
    }
  }

  const handleFeeTypeChange = (feeType) => {
    set('fee_type', feeType)
    if (form.course && COURSE_FEE_DEFAULTS[form.course]) {
      const defaultAmt = COURSE_FEE_DEFAULTS[form.course][feeType]
      if (defaultAmt) {
        set('amount', defaultAmt)
        setAutoFilled(true)
      }
    }
    // Auto-generate name
    if (form.course && feeType) {
      const typeLabel = FEE_STRUCTURE_TYPES.find(t => t.key === feeType)?.label || ''
      set('name', `${form.course} ${typeLabel}${form.semester ? ` Sem ${form.semester}` : ''}`)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSaving(true)
    setError('')
    try {
      const payload = { ...form, semester: form.semester || null }
      if (editItem) await api.put(`/fees/structures/${editItem.id}/`, payload)
      else await api.post('/fees/structures/', payload)
      setShowModal(false)
      load()
    } catch (err) {
      const d = err.response?.data
      setError(d ? Object.values(d).flat().join(' ') : 'Failed to save')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (id) => {
    if (!confirm('Delete this fee structure?')) return
    await api.delete(`/fees/structures/${id}/`)
    load()
  }

  const filtered = structures.filter(s => {
    const matchType = activeType === 'all' || s.fee_type === activeType
    const matchSearch = !search ||
      s.name.toLowerCase().includes(search.toLowerCase()) ||
      (s.course || '').toLowerCase().includes(search.toLowerCase())
    return matchType && matchSearch
  })

  const typeInfo = (key) => FEE_STRUCTURE_TYPES.find(t => t.key === key) || FEE_STRUCTURE_TYPES[7]

  const summary = FEE_STRUCTURE_TYPES.map(t => ({
    ...t,
    count: structures.filter(s => s.fee_type === t.key).length,
    total: structures.filter(s => s.fee_type === t.key).reduce((a, s) => a + Number(s.amount), 0),
  })).filter(t => t.count > 0)

  const selectedTypeInfo = typeInfo(form.fee_type)

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <div className="page-header">
        <div>
          <h1>Fee Structure</h1>
          <p>{structures.length} fee structures configured</p>
        </div>
        <button onClick={openAdd} className="btn btn-primary">+ Add Fee Structure</button>
      </div>

      {/* Course Default Amounts Reference Panel */}
      <div className="card">
        <div className="card-header">
          <h3>Course-wise Default Fee Amounts</h3>
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            {COURSES.map(c => (
              <button key={c} onClick={() => setViewCourse(c)}
                className={`btn btn-sm ${viewCourse === c ? 'btn-primary' : 'btn-outline'}`}>
                {c}
              </button>
            ))}
          </div>
        </div>
        <div className="card-body" style={{ padding: '16px 20px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: 10 }}>
            {FEE_STRUCTURE_TYPES.map(t => {
              const amt = COURSE_FEE_DEFAULTS[viewCourse]?.[t.key] || 0
              return (
                <div key={t.key} style={{
                  background: t.bg, border: `1.5px solid ${t.color}20`,
                  borderRadius: 10, padding: '12px 14px',
                }}>
                  <div style={{ fontSize: 12, fontWeight: 700, color: t.color }}>{t.label}</div>
                  <div style={{ fontSize: 18, fontWeight: 800, color: '#111827', marginTop: 4 }}>
                    {formatCurrency(amt)}
                  </div>
                  <div style={{ fontSize: 11, color: '#6b7280', marginTop: 2 }}>Default for {viewCourse}</div>
                </div>
              )
            })}
          </div>
        </div>
      </div>

      {/* Summary Cards */}
      {summary.length > 0 && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(170px, 1fr))', gap: 12 }}>
          {summary.map(t => (
            <div key={t.key}
              onClick={() => setActiveType(activeType === t.key ? 'all' : t.key)}
              style={{
                background: activeType === t.key ? t.color : 'var(--bg-card)',
                border: `2px solid ${activeType === t.key ? t.color : 'var(--border)'}`,
                borderRadius: 10, padding: '14px 16px', cursor: 'pointer', transition: 'all 0.15s',
              }}>
              <div style={{ fontSize: 22, marginBottom: 6 }}></div>
              <div style={{ fontWeight: 700, fontSize: 14, color: activeType === t.key ? '#fff' : t.color }}>{t.label}</div>
              <div style={{ fontSize: 12, color: activeType === t.key ? 'rgba(255,255,255,0.8)' : 'var(--text-muted)', marginTop: 2 }}>
                {t.count} plan{t.count !== 1 ? 's' : ''}
              </div>
              <div style={{ fontWeight: 700, fontSize: 14, color: activeType === t.key ? '#fff' : 'var(--text)', marginTop: 4 }}>
                {formatCurrency(t.total)}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Table */}
      <div className="card">
        <div className="toolbar">
          <div className="search-bar">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8" /><path d="M21 21l-4.35-4.35" /></svg>
            <input placeholder="Search structures..." value={search} onChange={e => setSearch(e.target.value)} />
          </div>
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            <button onClick={() => setActiveType('all')} className={`btn btn-sm ${activeType === 'all' ? 'btn-primary' : 'btn-outline'}`}>All</button>
            {FEE_STRUCTURE_TYPES.map(t => (
              <button key={t.key} onClick={() => setActiveType(activeType === t.key ? 'all' : t.key)}
                className={`btn btn-sm ${activeType === t.key ? 'btn-primary' : 'btn-outline'}`}>
                {t.label}
              </button>
            ))}
          </div>
        </div>

        {loading ? <Loader /> : filtered.length === 0 ? (
          <div className="empty-state">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M9 14l6-6m-5.5.5h.01m4.99 5h.01M19 21H5a2 2 0 01-2-2V5a2 2 0 012-2h11l5 5v11a2 2 0 01-2 2z" /></svg>
            <p>No fee structures found.</p>
            <span>Click "+ Add Fee Structure" to create one</span>
          </div>
        ) : (
          <div className="table-wrap">
            <table>
              <thead>
                <tr><th>Name</th><th>Type</th><th>Course</th><th>Semester</th><th>Academic Year</th><th>Amount</th><th>Status</th><th>Actions</th></tr>
              </thead>
              <tbody>
                {filtered.map(s => {
                  const ti = typeInfo(s.fee_type)
                  return (
                    <tr key={s.id}>
                      <td>
                        <div style={{ fontWeight: 600 }}>{s.name}</div>
                        {s.description && <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{s.description}</div>}
                      </td>
                      <td>
                        <span style={{
                          display: 'inline-flex', alignItems: 'center', gap: 5,
                          background: ti.bg, color: ti.color,
                          padding: '3px 10px', borderRadius: 999, fontSize: 12, fontWeight: 600
                        }}>
                          {ti.label}
                        </span>
                      </td>
                      <td>
                        {s.course
                          ? <span className="badge badge-info">{s.course}</span>
                          : <span style={{ color: 'var(--text-muted)' }}>All</span>}
                      </td>
                      <td>{s.semester ? `Sem ${s.semester}` : <span style={{ color: 'var(--text-muted)' }}>All</span>}</td>
                      <td>{s.academic_year}</td>
                      <td style={{ fontWeight: 800, color: 'var(--primary)', fontSize: 15 }}>{formatCurrency(s.amount)}</td>
                      <td>
                        <span className={`badge ${s.is_active ? 'badge-success' : 'badge-gray'}`}>
                          {s.is_active ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td>
                        <div className="actions">
                          <button onClick={() => openEdit(s)} className="btn btn-outline btn-sm">Edit</button>
                          <button onClick={() => handleDelete(s.id)} className="btn btn-danger btn-sm">Delete</button>
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

      {/* Add / Edit Modal */}
      {showModal && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: 16
        }}>
          <div style={{
            background: 'var(--bg-card)', borderRadius: 14, width: '100%', maxWidth: 580,
            maxHeight: '92vh', overflowY: 'auto', boxShadow: '0 24px 64px rgba(0,0,0,0.25)'
          }}>
            {/* Modal Header */}
            <div style={{
              padding: '20px 24px', borderBottom: '1px solid var(--border)',
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              background: selectedTypeInfo.bg,
            }}>
              <div>
                <div style={{ fontWeight: 800, fontSize: 16, color: selectedTypeInfo.color }}>
                  {editItem ? 'Edit Fee Structure' : 'Add Fee Structure'}
                </div>
                <div style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 2 }}>
                  Select course to auto-fill default amount
                </div>
              </div>
              <button onClick={() => setShowModal(false)}
                style={{ background: 'none', border: 'none', fontSize: 22, cursor: 'pointer', color: 'var(--text-muted)', lineHeight: 1 }}>
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmit} style={{ padding: 24 }}>
              {error && <div className="alert alert-error">{error}</div>}

              {/* Fee Type Selector */}
              <div className="form-group">
                <label className="form-label">Fee Type *</label>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8 }}>
                  {FEE_STRUCTURE_TYPES.map(t => (
                    <div key={t.key}
                      onClick={() => handleFeeTypeChange(t.key)}
                      style={{
                        border: `2px solid ${form.fee_type === t.key ? t.color : 'var(--border)'}`,
                        background: form.fee_type === t.key ? t.bg : 'var(--bg-card)',
                        borderRadius: 8, padding: '10px 8px', textAlign: 'center',
                        cursor: 'pointer', transition: 'all 0.15s'
                      }}>
                      <div style={{ fontSize: 12, fontWeight: 700, color: form.fee_type === t.key ? t.color : 'var(--text)', marginTop: 3 }}>
                        {t.label}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Course Selector — triggers auto-fill */}
              <div className="form-group">
                <label className="form-label">Course</label>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 6 }}>
                  {COURSES.map(c => {
                    const defaultAmt = COURSE_FEE_DEFAULTS[c]?.[form.fee_type]
                    return (
                      <div key={c}
                        onClick={() => handleCourseChange(c)}
                        style={{
                          border: `2px solid ${form.course === c ? 'var(--primary)' : 'var(--border)'}`,
                          background: form.course === c ? 'var(--primary-light)' : 'var(--bg-card)',
                          borderRadius: 8, padding: '8px 6px', textAlign: 'center',
                          cursor: 'pointer', transition: 'all 0.15s'
                        }}>
                        <div style={{ fontSize: 12, fontWeight: 700, color: form.course === c ? 'var(--primary)' : 'var(--text)' }}>
                          {c}
                        </div>
                        {defaultAmt && (
                          <div style={{ fontSize: 10, color: form.course === c ? 'var(--primary)' : 'var(--text-muted)', marginTop: 2, fontWeight: 600 }}>
                            ₹{(defaultAmt / 1000).toFixed(0)}k
                          </div>
                        )}
                      </div>
                    )
                  })}
                  <div
                    onClick={() => { set('course', ''); setAutoFilled(false) }}
                    style={{
                      border: `2px solid ${!form.course ? 'var(--primary)' : 'var(--border)'}`,
                      background: !form.course ? 'var(--primary-light)' : 'var(--bg-card)',
                      borderRadius: 8, padding: '8px 6px', textAlign: 'center',
                      cursor: 'pointer', transition: 'all 0.15s'
                    }}>
                    <div style={{ fontSize: 12, fontWeight: 700, color: !form.course ? 'var(--primary)' : 'var(--text-muted)' }}>All</div>
                    <div style={{ fontSize: 10, color: 'var(--text-muted)', marginTop: 2 }}>Courses</div>
                  </div>
                </div>
              </div>

              {/* Amount — auto-filled with green highlight */}
              <div className="form-grid">
                <div className="form-group">
                  <label className="form-label" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span>Amount (₹) *</span>
                    {autoFilled && (
                      <span style={{ fontSize: 11, color: '#059669', fontWeight: 700, display: 'flex', alignItems: 'center', gap: 3 }}>
                        ✓ Auto-filled
                      </span>
                    )}
                  </label>
                  <input
                    type="number" min="0" step="0.01"
                    value={form.amount}
                    onChange={e => { set('amount', e.target.value); setAutoFilled(false) }}
                    placeholder="0.00" required
                    style={{
                      borderColor: autoFilled ? '#059669' : undefined,
                      boxShadow: autoFilled ? '0 0 0 3px rgba(5,150,105,0.12)' : undefined,
                      fontWeight: autoFilled ? 700 : 400,
                    }}
                  />
                  {form.course && form.fee_type && COURSE_FEE_DEFAULTS[form.course]?.[form.fee_type] && (
                    <div style={{ fontSize: 11, color: '#059669', marginTop: 4 }}>
                      Default for {form.course} {FEE_STRUCTURE_TYPES.find(t => t.key === form.fee_type)?.label}:
                      <strong> {formatCurrency(COURSE_FEE_DEFAULTS[form.course][form.fee_type])}</strong>
                    </div>
                  )}
                </div>

                <div className="form-group">
                  <label className="form-label">Structure Name *</label>
                  <input value={form.name} onChange={e => set('name', e.target.value)}
                    placeholder="e.g. B.Tech Tuition Fee Sem 1" required />
                </div>

                <div className="form-group">
                  <label className="form-label">Semester</label>
                  <select value={form.semester} onChange={e => set('semester', e.target.value)}>
                    <option value="">All Semesters</option>
                    {SEMESTERS.map(s => <option key={s} value={s}>Semester {s}</option>)}
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">Academic Year</label>
                  <input value={form.academic_year} onChange={e => set('academic_year', e.target.value)} placeholder="2024-25" />
                </div>

                <div className="form-group">
                  <label className="form-label">Status</label>
                  <select value={form.is_active} onChange={e => set('is_active', e.target.value === 'true')}>
                    <option value="true">Active</option>
                    <option value="false">Inactive</option>
                  </select>
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Description</label>
                <textarea rows={2} value={form.description} onChange={e => set('description', e.target.value)}
                  placeholder="Optional notes about this fee structure" />
              </div>

              {/* Preview */}
              {form.amount && form.course && (
                <div style={{
                  background: selectedTypeInfo.bg, border: `1px solid ${selectedTypeInfo.color}30`,
                  borderRadius: 8, padding: '12px 16px', marginBottom: 16,
                  display: 'flex', alignItems: 'center', gap: 12
                }}>
                  <span style={{ fontSize: 24 }}></span>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: 14, color: selectedTypeInfo.color }}>
                      {form.course} — {selectedTypeInfo.label}
                    </div>
                    <div style={{ fontSize: 20, fontWeight: 800, color: 'var(--text)', marginTop: 2 }}>
                      {formatCurrency(form.amount)}
                    </div>
                  </div>
                </div>
              )}

              <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
                <button type="button" onClick={() => setShowModal(false)} className="btn btn-outline">Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={saving}>
                  {saving ? 'Saving...' : editItem ? 'Update Structure' : 'Add Structure'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
