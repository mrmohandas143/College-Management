import { useEffect, useState } from 'react'
import api from '../../api/axios'
import Loader from '../../components/Loader'
import useAuth from '../../hooks/useAuth'
import { formatDate, statusBadge, initials } from '../../utils/helpers'


export default function MyProfile() {
  const { user } = useAuth()
  const [student, setStudent] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)

  useEffect(() => {
    if (!user) return
    const studentId = user.student_id
    if (!studentId) {
      setTimeout(() => {
        setLoading(false)
        setError(true)
      }, 0)
      return
    }

    api.get(`/students/${studentId}/`)
      .then(r => {
        setStudent(r.data)
      })
      .catch(() => setError(true))
      .finally(() => setLoading(false))
  }, [user])

  if (loading) return <Loader />

  if (error || !student) return (
    <div className="empty-state" style={{ paddingTop: 80 }}>
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" style={{ width: 48, height: 48, margin: '0 auto 12px', opacity: 0.4 }}>
        <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" /><circle cx="9" cy="7" r="4" />
      </svg>
      <p style={{ fontSize: 15 }}>No student record linked to your account.</p>
      <p style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 6 }}>Please contact your administrator to link your account.</p>
    </div>
  )

  return (
    <div>
      <div className="page-header">
        <div><h1>My Profile</h1><p>Your academic information</p></div>
      </div>

      {/* Profile header card */}
      <div className="card" style={{ marginBottom: 16 }}>
        <div className="profile-header">
          <div className="profile-avatar" style={{ width: 64, height: 64, fontSize: 24 }}>
            {initials(student.first_name, student.last_name)}
          </div>
          <div className="profile-info">
            <h2>{student.first_name} {student.last_name}</h2>
            <p>{student.email}</p>
            <p style={{ marginTop: 6, display: 'flex', alignItems: 'center', gap: 8 }}>
              <span className={`badge ${statusBadge(student.status)}`}>{student.status}</span>
              <span style={{ color: 'var(--text-muted)', fontSize: 13 }}>{student.course} · Year {student.year}</span>
              <span style={{ color: 'var(--text-muted)', fontSize: 13 }}>Roll: {student.register_number}</span>
            </p>
          </div>
        </div>

        <div className="profile-grid">
          {[
            ['Roll Number', student.register_number],
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
    </div>
  )
}
