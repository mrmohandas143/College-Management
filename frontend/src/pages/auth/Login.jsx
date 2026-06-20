import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import useAuth from '../../hooks/useAuth'
import { login as loginApi } from '../../services/authService'

export default function Login() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const [form, setForm] = useState({ username: '', password: '' })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const { data } = await loginApi(form)
      const decoded = login(data.access, data.refresh)
      if (decoded.role === 'student') navigate('/my-profile')
      else if (['super_admin', 'admin'].includes(decoded.role)) navigate('/admin-panel')
      else navigate('/dashboard')
    } catch {
      setError('Invalid username or password. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="login-split">
      {/* Left panel */}
      <div className="login-left">
        <div className="login-left-orb orb1" />
        <div className="login-left-orb orb2" />
        <div className="login-left-content">
          <div className="login-brand">
            <div className="login-brand-icon">🎓</div>
            <span className="login-brand-name">CollegeMS</span>
          </div>
          <h2 className="login-left-title">Your College,<br />Fully Managed.</h2>
          <p className="login-left-sub">Students · Faculty · Fees · Hostel · Library · HR — all in one platform.</p>
          <div className="login-features">
            {['Role-based access control', 'Real-time analytics & reports', '15+ integrated modules', 'Secure & fast'].map(f => (
              <div key={f} className="login-feature-item">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#22c55e" strokeWidth="2.5"><path d="M20 6L9 17l-5-5" /></svg>
                {f}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right panel */}
      <div className="login-right">
        <div className="login-form-wrap">
          <div className="login-form-header">
            <h1>Welcome back</h1>
            <p>Sign in to your account to continue</p>
          </div>

          {error && (
            <div className="alert alert-error">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10" /><path d="M12 8v4M12 16h.01" /></svg>
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="login-form">
            <div className="form-group">
              <label className="form-label">Username</label>
              <div className="input-icon-wrap">
                <svg className="input-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2 M12 11a4 4 0 100-8 4 4 0 000 8z" /></svg>
                <input
                  placeholder="Enter your username"
                  value={form.username}
                  onChange={e => setForm({ ...form, username: e.target.value })}
                  required autoFocus autoComplete="username"
                  style={{ paddingLeft: 38 }}
                />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Password</label>
              <div className="input-icon-wrap">
                <svg className="input-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="11" width="18" height="11" rx="2" ry="2" /><path d="M7 11V7a5 5 0 0110 0v4" /></svg>
                <input
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Enter your password"
                  value={form.password}
                  onChange={e => setForm({ ...form, password: e.target.value })}
                  required autoComplete="current-password"
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

            <button type="submit" className="btn btn-primary btn-lg login-submit-btn" disabled={loading}>
              {loading ? (
                <>
                  <span className="btn-spinner" />
                  Signing in…
                </>
              ) : (
                <>
                  Sign In
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M15 3h4a2 2 0 012 2v14a2 2 0 01-2 2h-4M10 17l5-5-5-5M15 12H3" /></svg>
                </>
              )}
            </button>
          </form>

          <div className="login-back">
            <Link to="/">← Back to Home</Link>
          </div>
        </div>
      </div>
    </div>
  )
}
