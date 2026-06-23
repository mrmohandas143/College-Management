import { useState, useEffect } from 'react'
import { useNavigate, useParams, Link } from 'react-router-dom'
import { getStudent, updateStudent } from '../../services/studentService'
import { COURSES, COURSE_DEPARTMENTS } from '../../utils/constants'
import Loader from '../../components/Loader'

const PHONE_RE = /^(\+91[\s-]?)?[6-9]\d{9}$/
const MEDIA_BASE = 'http://localhost:8000'

export default function EditStudent() {
  const { id } = useParams()
  const [form, setForm] = useState(null)
  const [photoPreview, setPhotoPreview] = useState(null)
  const [phoneError, setPhoneError] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()

  useEffect(() => {
    getStudent(id).then(r => {
      const d = r.data
      setForm({ ...d, date_of_birth: d.date_of_birth || '', cgpa: d.cgpa ?? '', attendance_percentage: d.attendance_percentage ?? '' })
      if (d.photo) {
        // photo from API is a full URL (DRF serializer) or relative path — normalise both
        setPhotoPreview(d.photo.startsWith('http') ? d.photo : `${MEDIA_BASE}${d.photo}`)
      }
    })
  }, [id])

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  const handlePhone = (v) => {
    set('phone', v)
    if (v && !PHONE_RE.test(v.trim())) setPhoneError('Enter a valid 10-digit mobile number (e.g. 9876543210 or +91 9876543210)')
    else setPhoneError('')
  }

  const handlePhotoChange = (e) => {
    const file = e.target.files[0]
    if (file) { set('photo', file); setPhotoPreview(URL.createObjectURL(file)) }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (form.phone && !PHONE_RE.test(form.phone.trim())) return
    setError(''); setLoading(true)
    try {
      const formData = new FormData()
      Object.keys(form).forEach(key => {
        if (key === 'photo' && typeof form[key] === 'string') return
        if (form[key] !== null && form[key] !== undefined && form[key] !== '') formData.append(key, form[key])
      })
      await updateStudent(id, formData)
      navigate('/students')
    } catch (err) {
      const d = err.response?.data
      setError(d ? Object.values(d).flat().join(' ') : 'Failed to update student')
    } finally {
      setLoading(false)
    }
  }

  if (!form) return <Loader />

  return (
    <div className="fade-in">
      <div className="page-header slide-down">
        <div><h1>Edit Student</h1><p>Update student information</p></div>
        <Link to="/students" className="btn btn-outline">← Back</Link>
      </div>

      <div className="card form-card-anim">
        <div className="card-body">
          {error && <div className="alert alert-error">{error}</div>}
          <form onSubmit={handleSubmit}>
            <div className="form-group" style={{ marginBottom: 20 }}>
              <label className="form-label">Photo</label>
              <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                {photoPreview
                  ? <img src={photoPreview} alt="Preview" className="photo-preview-anim" style={{ width: 80, height: 80, borderRadius: 8, objectFit: 'cover', border: '2px solid var(--border)' }} />
                  : <div style={{ width: 80, height: 80, borderRadius: 8, background: 'var(--bg)', border: '2px dashed var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-light)', fontSize: 24 }}>👤</div>
                }
                <input type="file" accept="image/*" onChange={handlePhotoChange} />
              </div>
            </div>
            <div className="form-grid">
              {[
                ['First Name *', 'first_name', 'text', true],
                ['Last Name *', 'last_name', 'text', true],
                ['Email *', 'email', 'email', true],
              ].map(([label, key, type, req], i) => (
                <div className="form-group field-anim" key={key} style={{ '--i': i }}>
                  <label className="form-label">{label}</label>
                  <input className="form-control" type={type} value={form[key]} onChange={e => set(key, e.target.value)} required={req} />
                </div>
              ))}
              <div className="form-group field-anim" style={{ '--i': 3 }}>
                <label className="form-label">Phone</label>
                <input className={`form-control${phoneError ? ' input-error' : ''}`} value={form.phone} onChange={e => handlePhone(e.target.value)} placeholder="9876543210 or +91 9876543210" />
                {phoneError && <div className="form-error">{phoneError}</div>}
              </div>
              <div className="form-group field-anim" style={{ '--i': 4 }}>
                <label className="form-label">Register Number *</label>
                <input className="form-control" value={form.register_number} onChange={e => set('register_number', e.target.value)} required />
              </div>
              <div className="form-group field-anim" style={{ '--i': 5 }}>
                <label className="form-label">Gender *</label>
                <select className="form-control" value={form.gender} onChange={e => set('gender', e.target.value)}>
                  <option value="male">Male</option><option value="female">Female</option><option value="other">Other</option>
                </select>
              </div>
              <div className="form-group field-anim" style={{ '--i': 6 }}>
                <label className="form-label">Date of Birth</label>
                <input className="form-control" type="date" value={form.date_of_birth} onChange={e => set('date_of_birth', e.target.value)} />
              </div>
              <div className="form-group field-anim" style={{ '--i': 7 }}>
                <label className="form-label">Course *</label>
                <select className="form-control" value={form.course} onChange={e => { set('course', e.target.value); set('department', '') }} required>
                  <option value="">Select Course</option>
                  {COURSES.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div className="form-group field-anim" style={{ '--i': 8 }}>
                <label className="form-label">Department *</label>
                <select className="form-control" value={form.department || ''} onChange={e => set('department', e.target.value)} required disabled={!form.course}>
                  <option value="">{form.course ? 'Select Department' : 'Select Course first'}</option>
                  {(COURSE_DEPARTMENTS[form.course] || []).map(d => <option key={d} value={d}>{d}</option>)}
                </select>
              </div>
              <div className="form-group field-anim" style={{ '--i': 9 }}>
                <label className="form-label">Year *</label>
                <select className="form-control" value={form.year} onChange={e => set('year', Number(e.target.value))}>
                  {[1,2,3,4,5].map(y => <option key={y} value={y}>Year {y}</option>)}
                </select>
              </div>
              <div className="form-group field-anim" style={{ '--i': 10 }}>
                <label className="form-label">Status</label>
                <select className="form-control" value={form.status} onChange={e => set('status', e.target.value)}>
                  <option value="active">Active</option><option value="inactive">Inactive</option>
                </select>
              </div>
              <div className="form-group field-anim" style={{ '--i': 11 }}>
                <label className="form-label">CGPA</label>
                <input className="form-control" type="number" step="0.01" min="0" max="10" value={form.cgpa} onChange={e => set('cgpa', e.target.value)} placeholder="0.00 - 10.00" />
              </div>
              <div className="form-group field-anim" style={{ '--i': 12 }}>
                <label className="form-label">Attendance %</label>
                <input className="form-control" type="number" step="0.01" min="0" max="100" value={form.attendance_percentage} onChange={e => set('attendance_percentage', e.target.value)} placeholder="0.00 - 100.00" />
              </div>
            </div>
            <div className="form-group field-anim" style={{ '--i': 13 }}>
              <label className="form-label">Address</label>
              <textarea className="form-control" rows={3} value={form.address} onChange={e => set('address', e.target.value)} />
            </div>
            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
              <Link to="/students" className="btn btn-outline">Cancel</Link>
              <button type="submit" className="btn btn-primary" disabled={loading || !!phoneError}>
                {loading ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
