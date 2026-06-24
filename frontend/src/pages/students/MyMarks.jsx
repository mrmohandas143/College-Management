import { useEffect, useState } from 'react'
import api from '../../api/axios'
import Loader from '../../components/Loader'
import useAuth from '../../hooks/useAuth'

const MARKS = [
  { subject: 'Mathematics', internal: 38, external: 72, total: 110, max: 150 },
  { subject: 'Physics', internal: 35, external: 68, total: 103, max: 150 },
  { subject: 'Chemistry', internal: 40, external: 75, total: 115, max: 150 },
  { subject: 'English', internal: 42, external: 80, total: 122, max: 150 },
  { subject: 'Computer Science', internal: 45, external: 88, total: 133, max: 150 },
]

export default function MyMarks() {
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
          <h1>My Marks</h1>
          <p>Your academic scores and grades</p>
        </div>
      </div>

      <div className="card">
        <div className="card-body">
          <div style={{ marginBottom: 16, padding: '12px 16px', background: 'var(--bg)', borderRadius: 'var(--radius)', display: 'flex', gap: 24 }}>
            <div>
              <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>Total Marks</span>
              <div style={{ fontSize: 22, fontWeight: 700, color: 'var(--primary)' }}>
                {MARKS.reduce((s, m) => s + m.total, 0)} / {MARKS.reduce((s, m) => s + m.max, 0)}
              </div>
            </div>
            <div>
              <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>Percentage</span>
              <div style={{ fontSize: 22, fontWeight: 700 }}>
                {Math.round(MARKS.reduce((s, m) => s + m.total, 0) / MARKS.reduce((s, m) => s + m.max, 0) * 100)}%
              </div>
            </div>
          </div>
          <div className="table-wrap">
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr>
                  {['Subject', 'Internal', 'External', 'Total', 'Max', 'Grade'].map(h => (
                    <th key={h} style={{ padding: '10px 16px', textAlign: 'left', fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', borderBottom: '1px solid var(--border)', background: 'var(--bg)' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {MARKS.map(m => {
                  const pct = Math.round(m.total / m.max * 100)
                  const grade = pct >= 90 ? 'A+' : pct >= 80 ? 'A' : pct >= 70 ? 'B' : pct >= 60 ? 'C' : 'D'
                  const gradeCls = pct >= 80 ? 'badge-success' : pct >= 60 ? 'badge-warning' : 'badge-danger'
                  return (
                    <tr key={m.subject}>
                      <td style={{ padding: '12px 16px', fontWeight: 500, borderBottom: '1px solid var(--border)' }}>{m.subject}</td>
                      <td style={{ padding: '12px 16px', borderBottom: '1px solid var(--border)' }}>{m.internal}</td>
                      <td style={{ padding: '12px 16px', borderBottom: '1px solid var(--border)' }}>{m.external}</td>
                      <td style={{ padding: '12px 16px', fontWeight: 600, borderBottom: '1px solid var(--border)' }}>{m.total}</td>
                      <td style={{ padding: '12px 16px', borderBottom: '1px solid var(--border)', color: 'var(--text-muted)' }}>{m.max}</td>
                      <td style={{ padding: '12px 16px', borderBottom: '1px solid var(--border)' }}><span className={`badge ${gradeCls}`}>{grade}</span></td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  )
}
