import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import api from '../../api/axios'
import Loader from '../../components/Loader'
import useAuth from '../../hooks/useAuth'
import { formatDate, formatCurrency, statusBadge, initials } from '../../utils/helpers'

// Mock attendance data per subject (frontend-only, no backend change)
const ATTENDANCE = [
  { subject: 'Mathematics', total: 60, attended: 52 },
  { subject: 'Physics', total: 60, attended: 48 },
  { subject: 'Chemistry', total: 60, attended: 55 },
  { subject: 'English', total: 60, attended: 58 },
  { subject: 'Computer Science', total: 60, attended: 60 },
]

// Mock marks data (frontend-only, no backend change)
const MARKS = [
  { subject: 'Mathematics', internal: 38, external: 72, total: 110, max: 150 },
  { subject: 'Physics', internal: 35, external: 68, total: 103, max: 150 },
  { subject: 'Chemistry', internal: 40, external: 75, total: 115, max: 150 },
  { subject: 'English', internal: 42, external: 80, total: 122, max: 150 },
  { subject: 'Computer Science', internal: 45, external: 88, total: 133, max: 150 },
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

export default function MyProfile() {
  const { user } = useAuth()
  const [student, setStudent] = useState(null)
  const [fees, setFees] = useState([])
  const [feeStructures, setFeeStructures] = useState([])
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState('details')
  const [error, setError] = useState(false)

  useEffect(() => {
    if (!user) return
    const studentId = user.student_id
    if (!studentId) { setLoading(false); setError(true); return }

    api.get(`/students/${studentId}/`)
      .then(r => {
        const s = r.data
        setStudent(s)
        // Fetch student's fee records
        api.get(`/fees/`)
          .then(fr => setFees(fr.data.filter(f => String(f.student) === String(studentId))))
          .catch(() => setFees([]))
        // Fetch fee structures for student's course (match base course e.g. "B.Sc")
        const baseCourse = s.course?.split(' - ')[0] || s.course
        api.get('/fees/structures/')
          .then(sr => {
            const matched = sr.data.filter(st =>
              st.is_active && (!st.course || st.course === baseCourse || s.course?.includes(st.course))
            )
            setFeeStructures(matched)
          })
          .catch(() => setFeeStructures([]))
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

  const tabs = ['details', 'attendance', 'marks', 'fees']

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

        {/* Tabs */}
        <div style={{ display: 'flex', borderBottom: '1px solid var(--border)', padding: '0 20px' }}>
          {tabs.map(t => (
            <button key={t} onClick={() => setTab(t)} style={{
              padding: '10px 16px', border: 'none', background: 'none', cursor: 'pointer',
              fontWeight: 500, fontSize: 13, textTransform: 'capitalize',
              color: tab === t ? 'var(--primary)' : 'var(--text-muted)',
              borderBottom: tab === t ? '2px solid var(--primary)' : '2px solid transparent',
              marginBottom: -1,
            }}>
              {t}
            </button>
          ))}
        </div>

        {/* Details tab */}
        {tab === 'details' && (
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
        )}

        {/* Attendance tab */}
        {tab === 'attendance' && (
          <div className="card-body">
            <div style={{ marginBottom: 16, padding: '12px 16px', background: 'var(--bg)', borderRadius: 'var(--radius)', display: 'flex', gap: 24 }}>
              <div><span style={{ fontSize: 12, color: 'var(--text-muted)' }}>Overall Attendance</span>
                <div style={{ fontSize: 22, fontWeight: 700, color: 'var(--primary)' }}>
                  {Math.round(ATTENDANCE.reduce((s, a) => s + a.attended, 0) / ATTENDANCE.reduce((s, a) => s + a.total, 0) * 100)}%
                </div>
              </div>
              <div><span style={{ fontSize: 12, color: 'var(--text-muted)' }}>Classes Attended</span>
                <div style={{ fontSize: 22, fontWeight: 700 }}>
                  {ATTENDANCE.reduce((s, a) => s + a.attended, 0)} / {ATTENDANCE.reduce((s, a) => s + a.total, 0)}
                </div>
              </div>
            </div>
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
        )}

        {/* Marks tab */}
        {tab === 'marks' && (
          <div className="card-body">
            <div style={{ marginBottom: 16, padding: '12px 16px', background: 'var(--bg)', borderRadius: 'var(--radius)', display: 'flex', gap: 24 }}>
              <div><span style={{ fontSize: 12, color: 'var(--text-muted)' }}>Total Marks</span>
                <div style={{ fontSize: 22, fontWeight: 700, color: 'var(--primary)' }}>
                  {MARKS.reduce((s, m) => s + m.total, 0)} / {MARKS.reduce((s, m) => s + m.max, 0)}
                </div>
              </div>
              <div><span style={{ fontSize: 12, color: 'var(--text-muted)' }}>Percentage</span>
                <div style={{ fontSize: 22, fontWeight: 700 }}>
                  {Math.round(MARKS.reduce((s, m) => s + m.total, 0) / MARKS.reduce((s, m) => s + m.max, 0) * 100)}%
                </div>
              </div>
            </div>
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
        )}

        {/* Fees tab */}
        {tab === 'fees' && (
          <div>
            {/* Header with View Fee Details button */}
            <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div>
                <div style={{ fontWeight: 600, fontSize: 14 }}>My Fee Details</div>
                <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>
                  {student.course} · {fees.filter(f => f.status === 'paid').length} paid · {fees.filter(f => f.status === 'pending' || f.status === 'overdue').length} pending
                </div>
              </div>
              <Link to="/fees/pay" className="btn btn-primary" style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 1v22M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6"/></svg>
                View Fee Details
              </Link>
            </div>

            {/* Fee records table */}
            {fees.length === 0 ? (
              <div className="empty-state">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" style={{ width: 40, height: 40, margin: '0 auto 10px', opacity: 0.3 }}>
                  <path d="M12 1v22M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6"/>
                </svg>
                <p>No fee records yet.</p>
                <Link to="/fees/pay" className="btn btn-primary" style={{ marginTop: 12 }}>View Fee Details</Link>
              </div>
            ) : (
              <div className="table-wrap">
                <table>
                  <thead>
                    <tr><th>Fee Type</th><th>Amount</th><th>Due Date</th><th>Paid Date</th><th>Status</th><th>Action</th></tr>
                  </thead>
                  <tbody>
                    {fees.map(f => (
                      <tr key={f.id}>
                        <td style={{ fontWeight: 500 }}>{f.fee_type}</td>
                        <td style={{ fontWeight: 600 }}>{formatCurrency(f.net_amount || f.amount)}</td>
                        <td>{formatDate(f.due_date)}</td>
                        <td>{formatDate(f.paid_date)}</td>
                        <td><span className={`badge ${statusBadge(f.status)}`}>{f.status}</span></td>
                        <td>
                          {f.status === 'paid' ? (
                            <span style={{ fontSize: 12, color: 'var(--success)', fontWeight: 600 }}>Paid</span>
                          ) : (
                            <Link to="/fees/pay" className="btn btn-primary btn-sm">Pay Now</Link>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
