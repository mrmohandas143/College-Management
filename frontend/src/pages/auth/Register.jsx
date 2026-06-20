import { useState, useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { register as registerApi } from '../../services/authService'
import api from '../../api/axios'

export default function Register() {
  const navigate = useNavigate()
  const [form, setForm] = useState({ username: '', email: '', password: '', role: 'student', linked_student: '' })
  const [students, setStudents] = useState([])
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    // Load students for parent linking (public endpoint)
    api.get('/students/').then(r => setStudents(r.data)).catch(() => {})
  }, [])

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const payload = {
        ...form,
        linked_student: form.role === 'parent' && form.linked_student ? form.linked_student : null,
      }
      await registerApi(payload)
      navigate('/login')
    } catch (err) {
      const d = err.response?.data
      setError(d ? Object.values(d).flat().join(' ') : 'Registration failed')
    } finally {
      setLoading(false)
    }
  }

  const ROLES = [
    { value: 'student', label: '🎓 Student', desc: 'View your profile, fees & attendance' },
    { value: 'faculty', label: '👨‍🏫 Faculty', desc: 'Manage students and academics' },
    { value: 'parent', label: '👨‍👩‍👧 Parent', desc: 'Monitor your child\'s fees & updates' },
    { value: 'admin', label: '⚙️ Admin', desc: 'Full system access' },
  ]

  return (
    <div className="auth-page">
      <div className="auth-card" style={{ maxWidth: 460 }}>
        <div className="auth-logo">
          <h1>🎓 CollegeMS</h1>
          <p>Create a new account</p>
        </div>

        {error && <div className="alert alert-error">{error}</div>}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Username</label>
            <input placeholder="Choose a username" value={form.username}
              onChange={e => set('username', e.target.value)} required autoFocus />
          </div>
          <div className="form-group">
            <label className="form-label">Email</label>
            <input type="email" placeholder="Enter email" value={form.email}
              onChange={e => set('email', e.target.value)} required />
          </div>
          <div className="form-group">
            <label className="form-label">Password</label>
            <input type="password" placeholder="Create password" value={form.password}
              onChange={e => set('password', e.target.value)} required />
          </div>

          {/* Role Selector */}
          <div className="form-group">
            <label className="form-label">Role</label>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
              {ROLES.map(r => (
                <div key={r.value} onClick={() => set('role', r.value)} style={{
                  border: `2px solid ${form.role === r.value ? 'var(--primary)' : 'var(--border)'}`,
                  background: form.role === r.value ? 'var(--primary-light)' : '#fff',
                  borderRadius: 8, padding: '10px 12px', cursor: 'pointer', transition: 'all 0.15s'
                }}>
                  <div style={{ fontWeight: 600, fontSize: 13, color: form.role === r.value ? 'var(--primary)' : 'var(--text)' }}>
                    {r.label}
                  </div>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>{r.desc}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Parent: link to student */}
          {form.role === 'parent' && (
            <div className="form-group">
              <label className="form-label">Link to Student *</label>
              <select value={form.linked_student} onChange={e => set('linked_student', e.target.value)} required>
                <option value="">Select your child</option>
                {students.map(s => (
                  <option key={s.id} value={s.id}>
                    {s.first_name} {s.last_name} — {s.roll_number} ({s.course})
                  </option>
                ))}
              </select>
              <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 4 }}>
                Select the student record linked to your child
              </div>
            </div>
          )}

          <button type="submit" className="btn btn-primary"
            style={{ width: '100%', justifyContent: 'center', marginTop: 8 }} disabled={loading}>
            {loading ? 'Creating account...' : 'Register'}
          </button>
        </form>

        <div className="auth-footer">
          Already have an account? <Link to="/login">Sign in</Link>
        </div>
      </div>
    </div>
  )
}
