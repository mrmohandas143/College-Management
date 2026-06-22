import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { register as registerApi } from '../../services/authService'

export default function Register() {
  const navigate = useNavigate()
  const [form, setForm] = useState({ username: '', email: '', password: '', role: 'student' })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const payload = { ...form }
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
            <div className="input-icon-wrap">
              <svg className="input-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="11" width="18" height="11" rx="2" ry="2" /><path d="M7 11V7a5 5 0 0110 0v4" /></svg>
              <input
                type={showPassword ? 'text' : 'password'}
                placeholder="Create password"
                value={form.password}
                onChange={e => set('password', e.target.value)}
                required
                style={{ paddingLeft: 38, paddingRight: 42 }}
              />
              <button type="button" className="input-eye-btn" onClick={() => setShowPassword(s => !s)}>
                {showPassword ? (
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19m-6.72-1.07a3 3 0 11-4.24-4.24M1 1l22 22" /></svg>
                ) : (
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" /><circle cx="12" cy="12" r="3" /></svg>
                )}
              </button>
            </div>
          </div>

          {/* Role Selector */}
          <div className="form-group">
            <label className="form-label">Role</label>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
              {ROLES.map(r => (
                <div key={r.value} onClick={() => set('role', r.value)} style={{
                  border: `2px solid ${form.role === r.value ? 'var(--primary)' : 'var(--border)'}`,
                  background: form.role === r.value ? 'var(--primary-light)' : 'var(--bg-card)',
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
