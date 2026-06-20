import { useState, useEffect } from 'react'
import { useNavigate, useParams, Link } from 'react-router-dom'
import { getFee, updateFee } from '../../services/feeService'
import { getStudents } from '../../services/studentService'
import api from '../../api/axios'
import { FEE_TYPES } from '../../utils/constants'
import Loader from '../../components/Loader'

export default function EditFee() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [form, setForm] = useState(null)
  const [students, setStudents] = useState([])
  const [scholarships, setScholarships] = useState([])
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    Promise.all([
      getFee(id),
      getStudents(),
      api.get('/fees/scholarships/'),
    ]).then(([fee, studs, schols]) => {
      const f = fee.data
      setForm({
        student: f.student,
        fee_type: f.fee_type,
        amount: f.amount,
        discount_amount: f.discount_amount ?? 0,
        fine_amount: f.fine_amount ?? 0,
        scholarship: f.scholarship ?? '',
        semester: f.semester ?? '',
        academic_year: f.academic_year ?? '2024-25',
        due_date: f.due_date,
        paid_date: f.paid_date ?? '',
        status: f.status,
        payment_mode: f.payment_mode ?? '',
        transaction_id: f.transaction_id ?? '',
        description: f.description ?? '',
      })
      setStudents(studs.data)
      setScholarships(schols.data)
    }).finally(() => setLoading(false))
  }, [id])

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  const handleSubmit = async (e) => {
    e.preventDefault(); setError(''); setSaving(true)
    try {
      const payload = {
        ...form,
        paid_date: form.paid_date || null,
        scholarship: form.scholarship || null,
        semester: form.semester || null,
      }
      await updateFee(id, payload)
      navigate('/fees')
    } catch (err) {
      const d = err.response?.data
      setError(d ? Object.values(d).flat().join(' ') : 'Failed to update fee')
    } finally { setSaving(false) }
  }

  if (loading) return <Loader />

  return (
    <div>
      <div className="page-header">
        <div><h1>Edit Fee</h1><p>Update fee record #{id}</p></div>
        <Link to="/fees" className="btn btn-outline">← Back</Link>
      </div>

      <div className="card">
        <div className="card-body">
          {error && <div className="alert alert-error">{error}</div>}
          <form onSubmit={handleSubmit}>
            <div className="form-grid">
              <div className="form-group">
                <label className="form-label">Student *</label>
                <select value={form.student} onChange={e => set('student', e.target.value)} required>
                  <option value="">Select Student</option>
                  {students.map(s => <option key={s.id} value={s.id}>{s.first_name} {s.last_name} ({s.register_number})</option>)}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Fee Type *</label>
                <select value={form.fee_type} onChange={e => set('fee_type', e.target.value)} required>
                  <option value="">Select Type</option>
                  {FEE_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Amount (₹) *</label>
                <input type="number" min="0" step="0.01" value={form.amount} onChange={e => set('amount', e.target.value)} required />
              </div>
              <div className="form-group">
                <label className="form-label">Discount Amount (₹)</label>
                <input type="number" min="0" step="0.01" value={form.discount_amount} onChange={e => set('discount_amount', e.target.value)} />
              </div>
              <div className="form-group">
                <label className="form-label">Fine Amount (₹)</label>
                <input type="number" min="0" step="0.01" value={form.fine_amount} onChange={e => set('fine_amount', e.target.value)} />
              </div>
              <div className="form-group">
                <label className="form-label">Scholarship</label>
                <select value={form.scholarship} onChange={e => set('scholarship', e.target.value)}>
                  <option value="">None</option>
                  {scholarships.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Semester</label>
                <select value={form.semester} onChange={e => set('semester', e.target.value)}>
                  <option value="">Select Semester</option>
                  {[1,2,3,4,5,6,7,8].map(s => <option key={s} value={s}>Semester {s}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Academic Year</label>
                <input value={form.academic_year} onChange={e => set('academic_year', e.target.value)} />
              </div>
              <div className="form-group">
                <label className="form-label">Status</label>
                <select value={form.status} onChange={e => set('status', e.target.value)}>
                  <option value="pending">Pending</option>
                  <option value="paid">Paid</option>
                  <option value="overdue">Overdue</option>
                  <option value="partial">Partial</option>
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Payment Mode</label>
                <select value={form.payment_mode} onChange={e => set('payment_mode', e.target.value)}>
                  <option value="">Select</option>
                  {['Cash', 'Online', 'Cheque', 'DD', 'UPI', 'Card'].map(m => <option key={m} value={m}>{m}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Due Date *</label>
                <input type="date" value={form.due_date} onChange={e => set('due_date', e.target.value)} required />
              </div>
              <div className="form-group">
                <label className="form-label">Paid Date</label>
                <input type="date" value={form.paid_date} onChange={e => set('paid_date', e.target.value)} />
              </div>
            </div>
            <div className="form-group">
              <label className="form-label">Transaction ID</label>
              <input value={form.transaction_id} onChange={e => set('transaction_id', e.target.value)} placeholder="Optional" />
            </div>
            <div className="form-group">
              <label className="form-label">Description</label>
              <textarea rows={2} value={form.description} onChange={e => set('description', e.target.value)} />
            </div>
            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
              <Link to="/fees" className="btn btn-outline">Cancel</Link>
              <button type="submit" className="btn btn-primary" disabled={saving}>{saving ? 'Saving...' : 'Update Fee'}</button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
