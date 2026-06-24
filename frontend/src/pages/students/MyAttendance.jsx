import { useEffect, useState } from 'react'
import api from '../../api/axios'
import Loader from '../../components/Loader'
import useAuth from '../../hooks/useAuth'

const ATTENDANCE = [
  { subject: 'Mathematics', total: 60, attended: 52 },
  { subject: 'Physics', total: 60, attended: 48 },
  { subject: 'Chemistry', total: 60, attended: 55 },
  { subject: 'English', total: 60, attended: 58 },
  { subject: 'Computer Science', total: 60, attended: 60 },
]

const AttendanceBar = ({ attended, total }) => {
  const pct = Math.round((attended / total) * 100)
  const color = pct >= 75 ? '#22c55e' : pct >= 60 ? '#f59e0b' : '#ef4444'
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
      <div style={{ flex: 1, height: 8, background: 'var(--border)', borderRadius: 99 }}>
        <div style={{ width: `${pct}%`, height: '100%', background: color, borderRadius: 99, transition: 'width 0.4s' }} />
      </div>
      <span style={{ fontSize: 12, fontWeight: 600, color, minWidth: 36 }}>{pct}%</span>
    </div>
  )
}

export default function MyAttendance() {
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
        <div>
          <h1>My Attendance</h1>
          <p>Your class attendance summary</p>
        </div>
      </div>

      <div className="card">
        <div className="card-body">
          <div style={{ marginBottom: 16, padding: '12px 16px', background: 'var(--bg)', borderRadius: 'var(--radius)', display: 'flex', gap: 24 }}>
            <div>
              <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>Overall Attendance</span>
              <div style={{ fontSize: 22, fontWeight: 700, color: 'var(--primary)' }}>
                {Math.round(ATTENDANCE.reduce((s, a) => s + a.attended, 0) / ATTENDANCE.reduce((s, a) => s + a.total, 0) * 100)}%
              </div>
            </div>
            <div>
              <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>Classes Attended</span>
              <div style={{ fontSize: 22, fontWeight: 700 }}>
                {ATTENDANCE.reduce((s, a) => s + a.attended, 0)} / {ATTENDANCE.reduce((s, a) => s + a.total, 0)}
              </div>
            </div>
          </div>
          <div className="table-wrap">
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr>
                  {['Subject', 'Attended', 'Total', 'Attendance'].map(h => (
                    <th key={h} style={{ padding: '10px 16px', textAlign: 'left', fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', borderBottom: '1px solid var(--border)', background: 'var(--bg)' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {ATTENDANCE.map(a => (
                  <tr key={a.subject}>
                    <td style={{ padding: '12px 16px', fontWeight: 500, borderBottom: '1px solid var(--border)' }}>{a.subject}</td>
                    <td style={{ padding: '12px 16px', borderBottom: '1px solid var(--border)' }}>{a.attended}</td>
                    <td style={{ padding: '12px 16px', borderBottom: '1px solid var(--border)' }}>{a.total}</td>
                    <td style={{ padding: '12px 16px', borderBottom: '1px solid var(--border)', minWidth: 180 }}><AttendanceBar attended={a.attended} total={a.total} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  )
}
