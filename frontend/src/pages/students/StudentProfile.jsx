import { useEffect, useState } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { getStudent } from '../../services/studentService'
import api from '../../api/axios'
import Loader from '../../components/Loader'
import { formatDate, statusBadge, initials } from '../../utils/helpers'
import useAuth from '../../hooks/useAuth'

export default function StudentProfile() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { user } = useAuth()
  const isAdmin = ['admin', 'super_admin'].includes(user?.role)
  const [student, setStudent] = useState(null)
  const [password, setPassword] = useState('')
  const [pwMsg, setPwMsg] = useState('')
  const [pwLoading, setPwLoading] = useState(false)
  const [showPwForm, setShowPwForm] = useState(false)

  useEffect(() => {
    getStudent(id).then(r => setStudent(r.data)).catch(() => setStudent({}))
  }, [id])

  const handleSetPassword = async (e) => {
    e.preventDefault()
    setPwLoading(true)
    setPwMsg('')
    try {
      const res = await api.post('/accounts/create-student-account/', { student_id: id, password })
      setPwMsg({ type: 'success', text: res.data.message })
      setPassword('')
      setShowPwForm(false)
    } catch (err) {
      setPwMsg({ type: 'error', text: err.response?.data?.error || 'Failed to set password' })
    } finally {
      setPwLoading(false)
    }
  }

  if (!student) return <Loader />
  if (!student.id) return <div style={{ padding: 32, textAlign: 'center', color: 'var(--danger)' }}>Profile not found or access denied.</div>

  return (
    <div>
      <div className="page-header">
        <div><h1>Student Profile</h1></div>
        <div style={{ display: 'flex', gap: 8 }}>
          {isAdmin && <button onClick={() => navigate(`/students/${id}/edit`)} className="btn btn-primary">Edit</button>}
          {isAdmin && <Link to="/students" className="btn btn-outline">← Back</Link>}
        </div>
      </div>

      {/* Profile Header */}
      <div className="card" style={{ marginBottom: 16 }}>
        <div className="profile-header">
          <div className="profile-avatar">
            {student.photo
              ? <img src={student.photo} alt={student.first_name} style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '50%' }} />
              : initials(student.first_name, student.last_name)
            }
          </div>
          <div className="profile-info">
            <h2>{student.first_name} {student.last_name}</h2>
            <p>{student.email}</p>
            <p style={{ marginTop: 6 }}>
              <span className={`badge ${statusBadge(student.status)}`}>{student.status}</span>
              <span style={{ marginLeft: 8, color: 'var(--text-muted)', fontSize: 13 }}>{student.course} · Year {student.year}</span>
            </p>
          </div>
        </div>

        {/* Academic Stats */}
        <div style={{ display: 'flex', gap: 16, padding: '12px 0', borderTop: '1px solid var(--border)', borderBottom: '1px solid var(--border)', margin: '16px 0' }}>
          <div style={{ flex: 1, textAlign: 'center' }}>
            <div style={{ fontSize: 28, fontWeight: 700, color: 'var(--primary)' }}>
              {student.cgpa != null ? Number(student.cgpa).toFixed(2) : '—'}
            </div>
            <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 4 }}>CGPA</div>
          </div>
          <div style={{ width: 1, background: 'var(--border)' }} />
          <div style={{ flex: 1, textAlign: 'center' }}>
            <div style={{ fontSize: 28, fontWeight: 700, color: student.attendance_percentage >= 75 ? 'var(--success)' : 'var(--danger)' }}>
              {student.attendance_percentage != null ? `${Number(student.attendance_percentage).toFixed(1)}%` : '—'}
            </div>
            <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 4 }}>Attendance</div>
          </div>
        </div>

        <div className="profile-grid">
          {[
            ['Register Number', student.register_number],
            ['Gender', student.gender],
            ['Phone', student.phone || '—'],
            ['Date of Birth', formatDate(student.date_of_birth)],
            ['Course', student.course],
            ['Year', `Year ${student.year}`],
            ['Joined', formatDate(student.created_at)],
            ['Address', student.address || '—'],
          ].map(([label, value]) => (
            <div key={label} className="profile-item">
              <div className="profile-item-label">{label}</div>
              <div className="profile-item-value">{value}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Set Password — admin only */}
      {isAdmin && (
        <div className="card" style={{ marginBottom: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 20px' }}>
            <div>
              <div style={{ fontWeight: 600 }}>Login Account</div>
              <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>Username: <strong>{student.register_number}</strong></div>
            </div>
            <button onClick={() => { setShowPwForm(p => !p); setPwMsg('') }} className="btn btn-outline">
              {showPwForm ? 'Cancel' : 'Set Password'}
            </button>
          </div>
          {showPwForm && (
            <form onSubmit={handleSetPassword} style={{ padding: '0 20px 16px', display: 'flex', gap: 8 }}>
              <input
                type="password"
                placeholder="Enter new password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
                minLength={6}
                style={{ flex: 1 }}
              />
              <button type="submit" className="btn btn-primary" disabled={pwLoading}>
                {pwLoading ? 'Saving...' : 'Save'}
              </button>
            </form>
          )}
          {pwMsg && (
            <div style={{ padding: '0 20px 16px' }}>
              <div className={`alert alert-${pwMsg.type === 'success' ? 'success' : 'error'}`}>{pwMsg.text}</div>
            </div>
          )}
        </div>
      )}

      {/* Fees redirect — admin/super admin/accountant */}
      {['admin', 'super_admin', 'accountant'].includes(user?.role) && (
        <div className="card" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 20px' }}>
          <div>
            <div style={{ fontWeight: 600 }}>Fees & Payments</div>
            <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>
              <span>{student.register_number}</span>
              <span style={{ margin: '0 8px' }}>·</span>
              <span>{student.course}</span>
            </div>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <Link to={`/fees?student=${id}`} className="btn btn-outline">View Transactions</Link>
            <Link to={`/fees/pay?student=${id}`} className="btn btn-primary">View Fee Structure →</Link>
          </div>
        </div>
      )}
    </div>
  )
}
