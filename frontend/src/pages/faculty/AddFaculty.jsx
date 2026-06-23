import { useState } from 'react'
import { Link } from 'react-router-dom'
import { createFaculty } from '../../services/facultyService'
import { DEPARTMENTS, DESIGNATIONS, DEPARTMENT_COURSES } from '../../utils/constants'
import api from '../../api/axios'

const init = {
  first_name: '', last_name: '', email: '', phone: '',
  department: '', course: '', designation: '',
  qualification: '', experience: 0, status: 'active'
}

const generatePassword = () => {
  const upper = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'
  const lower = 'abcdefghijklmnopqrstuvwxyz'
  const digits = '0123456789'
  const special = '!@#$%^&*'
  const all = upper + lower + digits + special
  let pwd = [
    upper[Math.floor(Math.random() * upper.length)],
    lower[Math.floor(Math.random() * lower.length)],
    digits[Math.floor(Math.random() * digits.length)],
    special[Math.floor(Math.random() * special.length)],
  ]
  for (let i = 4; i < 10; i++) pwd.push(all[Math.floor(Math.random() * all.length)])
  return pwd.sort(() => Math.random() - 0.5).join('')
}

export default function AddFaculty() {
  const [form, setForm]       = useState(init)
  const [error, setError]     = useState('')
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(null)

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      // 1. Create faculty record
      const res = await createFaculty(form)
      const faculty = res.data

      // 2. Generate username and strong password
      const username = `${form.first_name.toLowerCase()}.${form.last_name.toLowerCase()}`
      const password = generatePassword()

      // 3. Backend creates login account + sends credentials email
      const res2 = await api.post('/accounts/send-faculty-credentials/', {
        username,
        password,
        email: form.email,
        name: `${form.first_name} ${form.last_name}`,
      })

      setSuccess({
        name: `${form.first_name} ${form.last_name}`,
        email: form.email,
        username: res2.data.username,
        password: res2.data.password,
        emailSent: res2.data.message?.includes('sent'),
        designation: faculty.designation,
        department: faculty.department,
      })
    } catch (err) {
      const d = err.response?.data
      setError(d ? Object.values(d).flat().join(' ') : 'Failed to add faculty')
    } finally {
      setLoading(false)
    }
  }

  // ── Success screen ──
  if (success) {
    return (
      <div>
        <div className="page-header">
          <div><h1>User Added Successfully</h1></div>
        </div>
        <div className="card">
          <div style={{ background: '#f0fdf4', borderBottom: '1px solid #bbf7d0', padding: '20px 24px', display: 'flex', alignItems: 'center', gap: 14 }}>
            <div style={{ width: 44, height: 44, borderRadius: '50%', background: '#22c55e', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5"><path d="M20 6L9 17l-5-5"/></svg>
            </div>
            <div>
              <div style={{ fontWeight: 700, color: '#15803d', fontSize: 15 }}>{success.name} has been added</div>
              <div style={{ fontSize: 13, color: '#166534', marginTop: 2 }}>{success.designation} · {success.department}</div>
            </div>
          </div>
          <div className="card-body">
            <div style={{ background: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: 10, padding: '16px 20px', marginBottom: 16 }}>
              <div style={{ fontWeight: 600, color: '#1d4ed8', marginBottom: 8 }}>
                {success.emailSent ? 'Login credentials sent to faculty email' : 'Login credentials created — share with faculty'}
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 }}>
                <div>
                  <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: 4 }}>Username</div>
                  <div style={{ fontFamily: 'monospace', fontWeight: 700, fontSize: 15, background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 6, padding: '8px 12px' }}>
                    {success.username}
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: 4 }}>Password</div>
                  <div style={{ fontFamily: 'monospace', fontWeight: 700, fontSize: 15, background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 6, padding: '8px 12px' }}>
                    {success.password}
                  </div>
                </div>
              </div>
              <div style={{ fontSize: 12, color: '#1e40af' }}>
                {success.emailSent
                  ? `Credentials also sent to ${success.email}`
                  : `Email delivery pending — please share credentials manually with ${success.email}`
                }
              </div>
            </div>
            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
              <button onClick={() => { setSuccess(null); setForm(init) }} className="btn btn-outline">Add Another User</button>
              <Link to="/faculty" className="btn btn-primary">Go to Users List</Link>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div>
      <div className="page-header">
        <div><h1>Add User</h1><p>Login credentials will be sent to the user email automatically.</p></div>
        <Link to="/faculty" className="btn btn-outline">← Back</Link>
      </div>
      <div className="card">
        <div className="card-body">
          {error && <div className="alert alert-error">{error}</div>}
          <form onSubmit={handleSubmit}>
            <div className="form-grid">
              <div className="form-group">
                <label className="form-label">First Name *</label>
                <input value={form.first_name} onChange={e => set('first_name', e.target.value)} required />
              </div>
              <div className="form-group">
                <label className="form-label">Last Name *</label>
                <input value={form.last_name} onChange={e => set('last_name', e.target.value)} required />
              </div>
              <div className="form-group">
                <label className="form-label">Email *</label>
                <input type="email" value={form.email} onChange={e => set('email', e.target.value)} required />
              </div>
              <div className="form-group">
                <label className="form-label">Phone</label>
                <input value={form.phone} onChange={e => set('phone', e.target.value)} />
              </div>
              <div className="form-group">
                <label className="form-label">Department *</label>
                <select value={form.department} onChange={e => { set('department', e.target.value); set('course', '') }} required>
                  <option value="">Select Department</option>
                  {DEPARTMENTS.map(d => <option key={d} value={d}>{d}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Course</label>
                <select value={form.course} onChange={e => set('course', e.target.value)} disabled={!form.department}>
                  <option value="">{form.department ? 'Select Course' : 'Select Department first'}</option>
                  {(DEPARTMENT_COURSES[form.department] || []).map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Designation *</label>
                <select value={form.designation} onChange={e => set('designation', e.target.value)} required>
                  <option value="">Select Designation</option>
                  {DESIGNATIONS.map(d => <option key={d} value={d}>{d}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Qualification</label>
                <input value={form.qualification} onChange={e => set('qualification', e.target.value)} placeholder="e.g. Ph.D, M.Tech" />
              </div>
              <div className="form-group">
                <label className="form-label">Experience (years)</label>
                <input type="number" min="0" value={form.experience} onChange={e => set('experience', Number(e.target.value))} />
              </div>
              <div className="form-group">
                <label className="form-label">Status</label>
                <select value={form.status} onChange={e => set('status', e.target.value)}>
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </select>
              </div>
            </div>
            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
              <Link to="/faculty" className="btn btn-outline">Cancel</Link>
              <button type="submit" className="btn btn-primary" disabled={loading}>
                {loading ? 'Adding & Sending Credentials...' : 'Add Faculty'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
