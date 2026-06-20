import { useState, useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { createFee } from '../../services/feeService'
import { getStudents } from '../../services/studentService'
import api from '../../api/axios'

const COURSES = ['B.Tech', 'M.Tech', 'BCA', 'MCA', 'B.Sc', 'M.Sc', 'B.Com', 'M.Com', 'BBA', 'MBA']

// Course-based default amounts (can be fetched from API in production)
const COURSE_DEFAULTS = {
  'B.Tech': 50000, 'M.Tech': 60000, 'BCA': 40000, 'MCA': 45000,
  'B.Sc': 35000, 'M.Sc': 40000, 'B.Com': 30000, 'M.Com': 35000,
  'BBA': 45000, 'MBA': 70000,
}

const FEE_TYPES = [
  { value: 'Tuition Fee', label: '🎓 Tuition Fee' },
  { value: 'Hostel Fee', label: '🏠 Hostel Fee' },
  { value: 'Transport Fee', label: '🚌 Transport Fee' },
  { value: 'Exam Fee', label: '📝 Exam Fee' },
  { value: 'Library Fee', label: '📚 Library Fee' },
  { value: 'Sports Fee', label: '⚽ Sports Fee' },
  { value: 'Other', label: '💼 Other' },
]

const init = {
  student: '', course: '', fee_type: '', amount: '',
  // Tuition fields
  semester: '', tuition_amount: '',
  // Hostel fields
  hostel_type: '', room_type: '', hostel_charges: '',
  // Transport fields
  route: '', bus_number: '', transport_charges: '',
  // Exam fields
  exam_type: '', exam_charges: '',
  // Library fields
  library_deposit: '', fine_amount: 0,
  // Sports fields
  sports_category: '', coaching_fee: '',
  // Other fields
  custom_fee_name: '', custom_amount: '',
  // Common fields
  discount_amount: 0, scholarship: '', academic_year: '2024-25',
  due_date: '', paid_date: '', status: 'pending',
  payment_mode: '', transaction_id: '', description: '',
}

export default function AddFee() {
  const [form, setForm] = useState(init)
  const [students, setStudents] = useState([])
  const [scholarships, setScholarships] = useState([])
  const [courseDefaults, setCourseDefaults] = useState(COURSE_DEFAULTS)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()

  useEffect(() => {
    Promise.all([
      getStudents(),
      api.get('/fees/scholarships/').catch(() => ({ data: [] })),
    ]).then(([s, sc]) => {
      setStudents(s.data)
      setScholarships(sc.data.filter(s => s.is_active))
    })
  }, [])

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  // Auto-fill amount when course changes
  useEffect(() => {
    if (form.course && courseDefaults[form.course]) {
      set('amount', courseDefaults[form.course])
    }
  }, [form.course, courseDefaults])

  // When student changes, set course
  useEffect(() => {
    if (form.student) {
      const student = students.find(s => String(s.id) === String(form.student))
      if (student) set('course', student.course)
    }
  }, [form.student, students])

  const selectedStudent = students.find(s => String(s.id) === String(form.student))

  const handleSubmit = async (e) => {
    e.preventDefault(); setError(''); setLoading(true)
    try {
      // Build final amount based on fee type
      let finalAmount = Number(form.amount) || 0
      if (form.fee_type === 'Tuition Fee' && form.tuition_amount) finalAmount = Number(form.tuition_amount)
      if (form.fee_type === 'Hostel Fee' && form.hostel_charges) finalAmount = Number(form.hostel_charges)
      if (form.fee_type === 'Transport Fee' && form.transport_charges) finalAmount = Number(form.transport_charges)
      if (form.fee_type === 'Exam Fee' && form.exam_charges) finalAmount = Number(form.exam_charges)
      if (form.fee_type === 'Library Fee' && form.library_deposit) finalAmount = Number(form.library_deposit)
      if (form.fee_type === 'Sports Fee' && form.coaching_fee) finalAmount = Number(form.coaching_fee)
      if (form.fee_type === 'Other' && form.custom_amount) finalAmount = Number(form.custom_amount)

      // Build description from dynamic fields
      let desc = form.description || ''
      if (form.fee_type === 'Tuition Fee') desc += ` | Semester: ${form.semester || 'N/A'}`
      if (form.fee_type === 'Hostel Fee') desc += ` | Hostel: ${form.hostel_type}, Room: ${form.room_type}`
      if (form.fee_type === 'Transport Fee') desc += ` | Route: ${form.route}, Bus: ${form.bus_number}`
      if (form.fee_type === 'Exam Fee') desc += ` | Exam Type: ${form.exam_type}`
      if (form.fee_type === 'Library Fee') desc += ` | Deposit: ₹${form.library_deposit}`
      if (form.fee_type === 'Sports Fee') desc += ` | Category: ${form.sports_category}`
      if (form.fee_type === 'Other') desc += ` | ${form.custom_fee_name}`

      const payload = {
        student: form.student,
        fee_type: form.fee_type,
        amount: finalAmount,
        discount_amount: form.discount_amount || 0,
        fine_amount: form.fine_amount || 0,
        scholarship: form.scholarship || null,
        semester: form.semester || null,
        academic_year: form.academic_year,
        due_date: form.due_date,
        paid_date: form.paid_date || null,
        status: form.status,
        payment_mode: form.payment_mode,
        transaction_id: form.transaction_id,
        description: desc.trim(),
      }
      await createFee(payload)
      navigate('/fees')
    } catch (err) {
      const d = err.response?.data
      setError(d ? Object.values(d).flat().join(' ') : 'Failed to add fee')
    } finally { setLoading(false) }
  }

  const netAmount = (Number(form.amount) || 0) - (Number(form.discount_amount) || 0) + (Number(form.fine_amount) || 0)

  return (
    <div>
      <div className="page-header">
        <div><h1>Add Fee</h1><p>Record a new fee with dynamic fields</p></div>
        <Link to="/fees" className="btn btn-outline">← Back</Link>
      </div>

      <div className="card">
        <div className="card-body">
          {error && <div className="alert alert-error">{error}</div>}
          <form onSubmit={handleSubmit}>

            {/* Student & Course */}
            <div className="form-grid">
              <div className="form-group">
                <label className="form-label">Student *</label>
                <select value={form.student} onChange={e => set('student', e.target.value)} required>
                  <option value="">Select Student</option>
                  {students.map(s => (
                    <option key={s.id} value={s.id}>
                      {s.first_name} {s.last_name} ({s.register_number})
                    </option>
                  ))}
                </select>
                {selectedStudent && (
                  <div style={{ marginTop: 5, display: 'flex', gap: 8 }}>
                    <span className="badge badge-info">{selectedStudent.course}</span>
                    <span className="badge badge-gray">Year {selectedStudent.year}</span>
                  </div>
                )}
              </div>

              <div className="form-group">
                <label className="form-label">Course *</label>
                <select value={form.course} onChange={e => set('course', e.target.value)} required>
                  <option value="">Select Course</option>
                  {COURSES.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
                {form.course && courseDefaults[form.course] && (
                  <div style={{ marginTop: 5, fontSize: 12, color: '#059669', fontWeight: 600 }}>
                    ✓ Default: ₹{courseDefaults[form.course].toLocaleString('en-IN')}
                  </div>
                )}
              </div>
            </div>

            {/* Fee Type Selector */}
            <div className="form-group">
              <label className="form-label">Fee Type *</label>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8 }}>
                {FEE_TYPES.map(t => (
                  <div key={t.value} onClick={() => set('fee_type', t.value)} style={{
                    border: `2px solid ${form.fee_type === t.value ? 'var(--primary)' : 'var(--border)'}`,
                    background: form.fee_type === t.value ? 'var(--primary-light)' : '#fff',
                    borderRadius: 8, padding: '10px 12px', textAlign: 'center',
                    cursor: 'pointer', transition: 'all 0.15s'
                  }}>
                    <div style={{ fontSize: 13, fontWeight: 600, color: form.fee_type === t.value ? 'var(--primary)' : 'var(--text)' }}>
                      {t.label}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Dynamic Fields Based on Fee Type */}
            {form.fee_type === 'Tuition Fee' && (
              <div className="form-grid">
                <div className="form-group">
                  <label className="form-label">Semester *</label>
                  <select value={form.semester} onChange={e => set('semester', e.target.value)} required>
                    <option value="">Select Semester</option>
                    {[1,2,3,4,5,6,7,8].map(s => <option key={s} value={s}>Semester {s}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Tuition Amount (₹) *</label>
                  <input type="number" min="0" step="0.01" value={form.tuition_amount}
                    onChange={e => set('tuition_amount', e.target.value)} placeholder={form.amount} required />
                </div>
              </div>
            )}

            {form.fee_type === 'Hostel Fee' && (
              <div className="form-grid-3">
                <div className="form-group">
                  <label className="form-label">Hostel Type *</label>
                  <select value={form.hostel_type} onChange={e => set('hostel_type', e.target.value)} required>
                    <option value="">Select</option>
                    {['Boys Hostel', 'Girls Hostel', 'PG Accommodation'].map(h => <option key={h} value={h}>{h}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Room Type *</label>
                  <select value={form.room_type} onChange={e => set('room_type', e.target.value)} required>
                    <option value="">Select</option>
                    {['Single', 'Double', 'Triple', 'Quad'].map(r => <option key={r} value={r}>{r}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Hostel Charges (₹) *</label>
                  <input type="number" min="0" step="0.01" value={form.hostel_charges}
                    onChange={e => set('hostel_charges', e.target.value)} required />
                </div>
              </div>
            )}

            {form.fee_type === 'Transport Fee' && (
              <div className="form-grid-3">
                <div className="form-group">
                  <label className="form-label">Route *</label>
                  <input value={form.route} onChange={e => set('route', e.target.value)} placeholder="e.g. Route 5A" required />
                </div>
                <div className="form-group">
                  <label className="form-label">Bus Number *</label>
                  <input value={form.bus_number} onChange={e => set('bus_number', e.target.value)} placeholder="e.g. BUS-12" required />
                </div>
                <div className="form-group">
                  <label className="form-label">Transport Charges (₹) *</label>
                  <input type="number" min="0" step="0.01" value={form.transport_charges}
                    onChange={e => set('transport_charges', e.target.value)} required />
                </div>
              </div>
            )}

            {form.fee_type === 'Exam Fee' && (
              <div className="form-grid">
                <div className="form-group">
                  <label className="form-label">Exam Type *</label>
                  <select value={form.exam_type} onChange={e => set('exam_type', e.target.value)} required>
                    <option value="">Select</option>
                    {['Mid-Term', 'End-Term', 'Supplementary', 'Revaluation', 'Practical'].map(e => <option key={e} value={e}>{e}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Exam Charges (₹) *</label>
                  <input type="number" min="0" step="0.01" value={form.exam_charges}
                    onChange={e => set('exam_charges', e.target.value)} required />
                </div>
              </div>
            )}

            {form.fee_type === 'Library Fee' && (
              <div className="form-grid">
                <div className="form-group">
                  <label className="form-label">Library Deposit (₹) *</label>
                  <input type="number" min="0" step="0.01" value={form.library_deposit}
                    onChange={e => set('library_deposit', e.target.value)} required />
                </div>
                <div className="form-group">
                  <label className="form-label">Fine Amount (₹)</label>
                  <input type="number" min="0" step="0.01" value={form.fine_amount}
                    onChange={e => set('fine_amount', e.target.value)} />
                </div>
              </div>
            )}

            {form.fee_type === 'Sports Fee' && (
              <div className="form-grid">
                <div className="form-group">
                  <label className="form-label">Sports Category *</label>
                  <select value={form.sports_category} onChange={e => set('sports_category', e.target.value)} required>
                    <option value="">Select</option>
                    {['Cricket', 'Football', 'Basketball', 'Badminton', 'Tennis', 'Swimming', 'Gym', 'Athletics'].map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Coaching Fee (₹) *</label>
                  <input type="number" min="0" step="0.01" value={form.coaching_fee}
                    onChange={e => set('coaching_fee', e.target.value)} required />
                </div>
              </div>
            )}

            {form.fee_type === 'Other' && (
              <div className="form-grid">
                <div className="form-group">
                  <label className="form-label">Custom Fee Name *</label>
                  <input value={form.custom_fee_name} onChange={e => set('custom_fee_name', e.target.value)}
                    placeholder="e.g. Lab Equipment Fee" required />
                </div>
                <div className="form-group">
                  <label className="form-label">Amount (₹) *</label>
                  <input type="number" min="0" step="0.01" value={form.custom_amount}
                    onChange={e => set('custom_amount', e.target.value)} required />
                </div>
              </div>
            )}

            {/* Common Fields */}
            <div className="form-grid">
              <div className="form-group">
                <label className="form-label">Base Amount (₹)</label>
                <input type="number" min="0" step="0.01" value={form.amount}
                  onChange={e => set('amount', e.target.value)} placeholder="Auto-filled from course" />
              </div>
              <div className="form-group">
                <label className="form-label">Discount Amount (₹)</label>
                <input type="number" min="0" step="0.01" value={form.discount_amount}
                  onChange={e => set('discount_amount', e.target.value)} />
              </div>
              <div className="form-group">
                <label className="form-label">Scholarship</label>
                <select value={form.scholarship} onChange={e => set('scholarship', e.target.value)}>
                  <option value="">None</option>
                  {scholarships.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
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
              <label className="form-label">Additional Description</label>
              <textarea rows={2} value={form.description} onChange={e => set('description', e.target.value)} />
            </div>

            {/* Net Amount Preview */}
            {form.amount && (
              <div style={{
                background: '#eff6ff', border: '1px solid #bfdbfe',
                borderRadius: 8, padding: '12px 16px', marginBottom: 16,
                display: 'flex', gap: 24, flexWrap: 'wrap', alignItems: 'center'
              }}>
                <span style={{ fontSize: 13, color: '#1d4ed8' }}>
                  Base: <strong>₹{Number(form.amount).toLocaleString('en-IN')}</strong>
                </span>
                {Number(form.discount_amount) > 0 && (
                  <span style={{ fontSize: 13, color: '#15803d' }}>
                    Discount: <strong>-₹{Number(form.discount_amount).toLocaleString('en-IN')}</strong>
                  </span>
                )}
                {Number(form.fine_amount) > 0 && (
                  <span style={{ fontSize: 13, color: '#dc2626' }}>
                    Fine: <strong>+₹{Number(form.fine_amount).toLocaleString('en-IN')}</strong>
                  </span>
                )}
                <span style={{ fontSize: 14, fontWeight: 700, color: '#1d4ed8', marginLeft: 'auto' }}>
                  Net: ₹{netAmount.toLocaleString('en-IN')}
                </span>
              </div>
            )}

            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
              <Link to="/fees" className="btn btn-outline">Cancel</Link>
              <button type="submit" className="btn btn-primary" disabled={loading}>
                {loading ? 'Saving...' : 'Add Fee'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
