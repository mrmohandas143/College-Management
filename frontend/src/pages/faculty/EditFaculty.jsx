import { useState, useEffect } from 'react'
import { useNavigate, useParams, Link } from 'react-router-dom'
import { getFacultyById, updateFaculty } from '../../services/facultyService'
import { DEPARTMENTS, DESIGNATIONS, DEPARTMENT_COURSES } from '../../utils/constants'
import Loader from '../../components/Loader'

export default function EditFaculty() {
  const { id } = useParams()
  const [form, setForm] = useState(null)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()

  useEffect(() => { getFacultyById(id).then(r => setForm(r.data)) }, [id])

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      await updateFaculty(id, form)
      navigate('/faculty')
    } catch (err) {
      const d = err.response?.data
      setError(d ? Object.values(d).flat().join(' ') : 'Failed to update faculty')
    } finally {
      setLoading(false)
    }
  }

  if (!form) return <Loader />

  return (
    <div>
      <div className="page-header">
        <div><h1>Edit User</h1><p>Update user information</p></div>
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
                <select value={form.course || ''} onChange={e => set('course', e.target.value)} disabled={!form.department}>
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
                <input value={form.qualification} onChange={e => set('qualification', e.target.value)} />
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
              <button type="submit" className="btn btn-primary" disabled={loading}>{loading ? 'Saving...' : 'Save Changes'}</button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
