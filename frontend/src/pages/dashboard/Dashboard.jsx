import { useEffect, useState } from 'react'
import { Link, Navigate } from 'react-router-dom'
import api from '../../api/axios'
import { ENDPOINTS } from '../../api/endpoints'
import Loader from '../../components/Loader'
import useAuth from '../../hooks/useAuth'
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from 'recharts'

const COLORS = ['#2563eb', '#7c3aed', '#059669', '#d97706', '#dc2626', '#0891b2']

const StatCard = ({ icon, label, value, sub, color, onClick }) => (
  <div className="stat-card" onClick={onClick} style={{ cursor: onClick ? 'pointer' : 'default' }}>
    <div className="stat-icon" style={{ background: color + '20' }}>
      <svg viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d={icon} />
      </svg>
    </div>
    <div className="stat-value">{value}</div>
    <div className="stat-label">{label}</div>
    {sub && <div className="stat-sub">{sub}</div>}
  </div>
)

export default function Dashboard() {
  const { user } = useAuth()
  const role = user?.role
  const [data, setData] = useState(null)
  const [students, setStudents] = useState([])
  const [faculty, setFaculty] = useState([])
  const [fees, setFees] = useState([])
  const [loading, setLoading] = useState(true)
  const [myFacultyId, setMyFacultyId] = useState(null)
  const [modal, setModal] = useState(null)

  const openFeeModal = (type) => {
    const filtered = type === 'paid'
      ? fees.filter(f => f.status === 'paid')
      : fees.filter(f => f.status === 'pending' || f.status === 'overdue')
    setModal({ title: type === 'paid' ? 'Fee Collected' : 'Pending / Overdue Fees', rows: filtered })
  }

  useEffect(() => {
    if (role === 'student') return

    const ADMIN_ROLES   = ['super_admin', 'admin']
    const FINANCE_ROLES = ['super_admin', 'admin', 'accountant']
    const STAFF_ROLES   = ['super_admin', 'admin', 'faculty', 'hr']

    Promise.all([
      api.get(ENDPOINTS.DASHBOARD),
      STAFF_ROLES.includes(role) ? api.get(ENDPOINTS.STUDENTS) : Promise.resolve({ data: [] }),
      STAFF_ROLES.includes(role) ? api.get(ENDPOINTS.FACULTY)  : Promise.resolve({ data: [] }),
      FINANCE_ROLES.includes(role) ? api.get(ENDPOINTS.FEES)   : Promise.resolve({ data: [] }),
    ]).then(([dash, stu, fac, fee]) => {
      setData(dash.data)
      setStudents(stu.data.results ?? stu.data)
      setFaculty(fac.data.results  ?? fac.data)
      setFees(fee.data.results     ?? fee.data)
      if (role === 'faculty') {
        const match = (fac.data.results ?? fac.data).find(f =>
          f.email === user?.username ||
          f.email?.split('@')[0] === user?.username ||
          `${f.first_name.toLowerCase()}.${f.last_name.toLowerCase()}` === user?.username?.toLowerCase()
        )
        if (match) setMyFacultyId(match.id)
      }
    }).finally(() => setLoading(false))
  }, [role])

  if (role === 'student') return <Navigate to="/my-profile" replace />
  if (role === 'faculty' && myFacultyId) return <Navigate to={`/faculty/${myFacultyId}`} replace />
  if (role === 'faculty' && !loading && !myFacultyId) return <Navigate to="/students" replace />
  // Specialist roles — show a focused dashboard (no redirect)
  const specialistRoles = ['hr','accountant','librarian','hostel_warden','placement_officer','transport_incharge','alumni_coordinator']
  if (loading) return <Loader />

  // ── Derive department stats from real student data ──
  const deptMap = {}
  students.forEach(s => {
    if (!s.course) return
    if (!deptMap[s.course]) deptMap[s.course] = { name: s.course, students: 0 }
    deptMap[s.course].students++
  })
  const deptFacMap = {}
  faculty.forEach(f => {
    if (!f.department) return
    if (!deptFacMap[f.department]) deptFacMap[f.department] = 0
    deptFacMap[f.department]++
  })
  const departments = Object.values(deptMap).map((d, i) => ({
    ...d,
    faculty: deptFacMap[d.name] || 0,
    color: COLORS[i % COLORS.length],
  }))
  const totalDeptStudents = departments.reduce((s, d) => s + d.students, 0)

  // ── Derive growth chart from real student join dates ──
  const monthNames = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']
  const growthMap = {}
  monthNames.forEach(m => { growthMap[m] = { month: m, students: 0, faculty: 0 } })
  students.forEach(s => {
    if (!s.created_at) return
    const m = monthNames[new Date(s.created_at).getMonth()]
    if (growthMap[m]) growthMap[m].students++
  })
  faculty.forEach(f => {
    if (!f.created_at) return
    const m = monthNames[new Date(f.created_at).getMonth()]
    if (growthMap[m]) growthMap[m].faculty++
  })
  const growthData = Object.values(growthMap)

  // ── Derive fee pie from real fee data ──
  const paidFees = fees.filter(f => f.status === 'paid').length
  const pendingFees = fees.filter(f => f.status === 'pending').length
  const overdueFees = fees.filter(f => f.status === 'overdue').length
  const totalFees = fees.length
  const feePie = totalFees > 0 ? [
    { name: 'Paid',    value: paidFees,    color: '#22c55e' },
    { name: 'Pending', value: pendingFees, color: '#f59e0b' },
    { name: 'Overdue', value: overdueFees, color: '#ef4444' },
  ].filter(f => f.value > 0) : []

  // ── Derive student status pie ──
  const activeStudents = students.filter(s => s.status === 'active').length
  const inactiveStudents = students.filter(s => s.status === 'inactive').length
  const studentPie = students.length > 0 ? [
    { name: 'Active',   value: activeStudents,   color: '#22c55e' },
    { name: 'Inactive', value: inactiveStudents, color: '#ef4444' },
  ].filter(s => s.value > 0) : []

  // ── Derive course distribution bar chart ──
  const courseBar = departments.map(d => ({ course: d.name.length > 10 ? d.name.slice(0, 10) + '…' : d.name, students: d.students, faculty: d.faculty }))

  const hasData = students.length > 0 || faculty.length > 0

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>

      {/* Welcome */}
      <div className="page-header" style={{ marginBottom: 0 }}>
        <div>
          <h1>Dashboard</h1>
          <p>Welcome back, <strong>{user?.username}</strong> &nbsp;·&nbsp;
            <span style={{ textTransform: 'capitalize', color: 'var(--primary)' }}>{role}</span>
          </p>
        </div>
        <div style={{ fontSize: 13, color: 'var(--text-muted)', textAlign: 'right' }}>
          <div style={{ fontWeight: 600, color: 'var(--text)' }}>CollegeMS</div>
          <div>{new Date().toLocaleDateString('en-IN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</div>
        </div>
      </div>

      {/* ── Stat Cards ── */}
      <div className="stats-grid">
        <StatCard icon="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2 M9 11a4 4 0 100-8 4 4 0 000 8z M23 21v-2a4 4 0 00-3-3.87 M16 3.13a4 4 0 010 7.75"
          label="Total Students" value={data?.students?.total ?? 0} sub={`${data?.students?.active ?? 0} active`} color="#2563eb" />

        {(role === 'admin' || role === 'faculty') && (
          <StatCard icon="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2 M12 11a4 4 0 100-8 4 4 0 000 8z"
            label="Total Faculty" value={data?.faculty?.total ?? 0} sub={`${data?.faculty?.active ?? 0} active`} color="#7c3aed" />
        )}

        <StatCard icon="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"
          label="Departments" value={departments.length} sub={`${totalDeptStudents} students enrolled`} color="#059669" />

        {['super_admin','admin','accountant'].includes(role) && (
          <>
            <StatCard icon="M12 1v22 M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6"
              label="Fee Collected" value={paidFees} sub={`of ${totalFees} total records`} color="#0891b2" onClick={() => openFeeModal('paid')} />
            <StatCard icon="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z M12 9v4 M12 17h.01"
              label="Pending Fees" value={pendingFees + overdueFees} sub={`${overdueFees} overdue`} color="#dc2626" onClick={() => openFeeModal('pending')} />
          </>
        )}
      </div>

      {!hasData ? (
        <div className="card">
          <div className="empty-state" style={{ padding: '60px 20px' }}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" style={{ width: 48, height: 48, margin: '0 auto 12px', opacity: 0.3 }}>
              <path d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
            <p style={{ fontSize: 15, fontWeight: 500 }}>No data yet</p>
            <p style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 6 }}>Add students and faculty to see charts and analytics here.</p>
            <div style={{ display: 'flex', gap: 10, justifyContent: 'center', marginTop: 20 }}>
              <Link to="/students/add" className="btn btn-primary">+ Add Student</Link>
              {role === 'admin' && <Link to="/faculty/add" className="btn btn-outline">+ Add Faculty</Link>}
            </div>
          </div>
        </div>
      ) : (
        <>
          {/* ── Growth Chart ── */}
          <div className="card">
            <div className="card-header">
              <h3>College Growth</h3>
              <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>Enrollments by month (current year)</span>
            </div>
            <div className="card-body">
              <ResponsiveContainer width="100%" height={260}>
                <AreaChart data={growthData} margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="gStudents" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#2563eb" stopOpacity={0.15} />
                      <stop offset="95%" stopColor="#2563eb" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="gFaculty" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#7c3aed" stopOpacity={0.15} />
                      <stop offset="95%" stopColor="#7c3aed" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 12 }} allowDecimals={false} />
                  <Tooltip contentStyle={{ borderRadius: 8, border: '1px solid #e5e7eb', fontSize: 13 }} />
                  <Legend />
                  <Area type="monotone" dataKey="students" stroke="#2563eb" strokeWidth={2} fill="url(#gStudents)" name="Students" />
                  <Area type="monotone" dataKey="faculty" stroke="#7c3aed" strokeWidth={2} fill="url(#gFaculty)" name="Faculty" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* ── Course Distribution + Pie Charts ── */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>

            {/* Course/Department Bar Chart */}
            <div className="card">
              <div className="card-header">
                <h3>Students by Course</h3>
                <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>Real enrollment data</span>
              </div>
              <div className="card-body">
                {courseBar.length === 0 ? (
                  <div className="empty-state"><p>No course data yet</p></div>
                ) : (
                  <ResponsiveContainer width="100%" height={240}>
                    <BarChart data={courseBar} margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                      <XAxis dataKey="course" tick={{ fontSize: 10 }} />
                      <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
                      <Tooltip contentStyle={{ borderRadius: 8, border: '1px solid #e5e7eb', fontSize: 12 }} />
                      <Legend />
                      <Bar dataKey="students" fill="#2563eb" name="Students" radius={[3,3,0,0]} />
                      <Bar dataKey="faculty" fill="#7c3aed" name="Faculty" radius={[3,3,0,0]} />
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </div>
            </div>

            {/* Student Status Pie */}
            <div className="card">
              <div className="card-header">
                <h3>Student Status</h3>
                <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>Active vs Inactive</span>
              </div>
              <div className="card-body" style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
                {studentPie.length === 0 ? (
                  <div className="empty-state" style={{ flex: 1 }}><p>No student data yet</p></div>
                ) : (
                  <>
                    <ResponsiveContainer width="55%" height={220}>
                      <PieChart>
                        <Pie data={studentPie} cx="50%" cy="50%" innerRadius={55} outerRadius={85} paddingAngle={3} dataKey="value">
                          {studentPie.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                        </Pie>
                        <Tooltip contentStyle={{ borderRadius: 8, border: '1px solid #e5e7eb', fontSize: 12 }} />
                      </PieChart>
                    </ResponsiveContainer>
                    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 12 }}>
                      {studentPie.map(item => (
                        <div key={item.name} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                          <div style={{ width: 12, height: 12, borderRadius: 3, background: item.color, flexShrink: 0 }} />
                          <div>
                            <div style={{ fontSize: 13, fontWeight: 500 }}>{item.name}</div>
                            <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{item.value} students</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* ── Departments from real data ── */}
          {departments.length > 0 && (
            <div className="card">
              <div className="card-header">
                <h3>Departments</h3>
                <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>{departments.length} courses · {totalDeptStudents} students</span>
              </div>
              <div className="card-body">
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 12 }}>
                  {departments.map(dept => {
                    const pct = totalDeptStudents > 0 ? Math.round((dept.students / totalDeptStudents) * 100) : 0
                    return (
                      <div key={dept.name} style={{ padding: '14px 16px', border: '1px solid var(--border)', borderRadius: 'var(--radius)', background: 'var(--bg)' }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
                          <div style={{ fontWeight: 600, fontSize: 13 }}>{dept.name}</div>
                          <div style={{ width: 10, height: 10, borderRadius: '50%', background: dept.color }} />
                        </div>
                        <div style={{ display: 'flex', gap: 16, marginBottom: 10 }}>
                          <div>
                            <div style={{ fontSize: 20, fontWeight: 700, color: dept.color }}>{dept.students}</div>
                            <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>Students</div>
                          </div>
                          <div>
                            <div style={{ fontSize: 20, fontWeight: 700, color: 'var(--text)' }}>{dept.faculty}</div>
                            <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>Faculty</div>
                          </div>
                        </div>
                        <div style={{ height: 6, background: 'var(--border)', borderRadius: 99 }}>
                          <div style={{ width: `${pct}%`, height: '100%', background: dept.color, borderRadius: 99 }} />
                        </div>
                        <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4 }}>{pct}% of total students</div>
                      </div>
                    )
                  })}
                </div>
              </div>
            </div>
          )}

          {/* ── Fee Status (admin only) ── */}
          {role === 'admin' && feePie.length > 0 && (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              <div className="card">
                <div className="card-header"><h3>Fee Status</h3></div>
                <div className="card-body" style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
                  <ResponsiveContainer width="55%" height={180}>
                    <PieChart>
                      <Pie data={feePie} cx="50%" cy="50%" innerRadius={45} outerRadius={70} paddingAngle={3} dataKey="value">
                        {feePie.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                      </Pie>
                      <Tooltip contentStyle={{ borderRadius: 8, border: '1px solid #e5e7eb', fontSize: 12 }} />
                    </PieChart>
                  </ResponsiveContainer>
                  <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 10 }}>
                    {feePie.map(item => (
                      <div key={item.name} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <div style={{ width: 10, height: 10, borderRadius: 3, background: item.color }} />
                          <span style={{ fontSize: 13 }}>{item.name}</span>
                        </div>
                        <span style={{ fontWeight: 600 }}>{item.value}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="card">
                <div className="card-header"><h3>Quick Actions</h3></div>
                <div className="card-body" style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  <Link to="/students/add" className="btn btn-primary">+ Add New Student</Link>
                  <Link to="/faculty/add" className="btn btn-outline">+ Add New Faculty</Link>
                  <Link to="/fees/add" className="btn btn-outline">+ Record Fee Payment</Link>
                  <Link to="/fees/history" className="btn btn-outline">View Payment History</Link>
                </div>
              </div>
            </div>
          )}

          {/* Quick actions when no fees yet */}
          {role === 'admin' && feePie.length === 0 && (
            <div className="card">
              <div className="card-header"><h3>⚡ Quick Actions</h3></div>
              <div className="card-body" style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                <Link to="/students/add" className="btn btn-primary">+ Add New Student</Link>
                <Link to="/faculty/add" className="btn btn-outline">+ Add New Faculty</Link>
                <Link to="/fees/add" className="btn btn-outline">+ Record Fee Payment</Link>
                <Link to="/fees/history" className="btn btn-outline">View Payment History</Link>
              </div>
            </div>
          )}

          {role === 'faculty' && (
            <div className="card">
              <div className="card-header"><h3>Quick Actions</h3></div>
              <div className="card-body" style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                <Link to="/students/add" className="btn btn-primary">+ Add New Student</Link>
                <Link to="/students" className="btn btn-outline">View All Students</Link>
                <Link to="/faculty" className="btn btn-outline">View Faculty</Link>
              </div>
            </div>
          )}

          {['hr'].includes(role) && (
            <div className="card">
              <div className="card-header"><h3>Quick Actions</h3></div>
              <div className="card-body" style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                <Link to="/hr/employees" className="btn btn-primary">Employees</Link>
                <Link to="/hr/attendance" className="btn btn-outline">Attendance</Link>
                <Link to="/hr/leaves" className="btn btn-outline">Leave Requests</Link>
                <Link to="/hr/payroll" className="btn btn-outline">Payroll</Link>
              </div>
            </div>
          )}

          {['accountant'].includes(role) && (
            <div className="card">
              <div className="card-header"><h3>Quick Actions</h3></div>
              <div className="card-body" style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                <Link to="/fees" className="btn btn-primary">Fee Records</Link>
                <Link to="/fees/add" className="btn btn-outline">Record Payment</Link>
                <Link to="/fees/history" className="btn btn-outline">Payment History</Link>
              </div>
            </div>
          )}
        </>
      )}

      {/* Fee Detail Modal */}
      {modal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: 16 }}>
          <div style={{ background: 'var(--bg-card)', borderRadius: 14, width: '100%', maxWidth: 700, maxHeight: '85vh', display: 'flex', flexDirection: 'column', boxShadow: '0 24px 64px rgba(0,0,0,0.25)' }}>
            <div style={{ padding: '18px 24px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ margin: 0 }}>{modal.title} ({modal.rows.length})</h3>
              <button onClick={() => setModal(null)} style={{ background: 'none', border: 'none', fontSize: 22, cursor: 'pointer', color: 'var(--text-muted)' }}>✕</button>
            </div>
            <div style={{ overflowY: 'auto', flex: 1 }}>
              {modal.rows.length === 0 ? (
                <div style={{ padding: 40, textAlign: 'center', color: 'var(--text-muted)' }}>No records found.</div>
              ) : (
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ background: 'var(--bg)' }}>
                      {['Student', 'Fee Type', 'Amount', 'Due Date', 'Paid Date', 'Status'].map(h => (
                        <th key={h} style={{ padding: '10px 16px', textAlign: 'left', fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', borderBottom: '1px solid var(--border)' }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {modal.rows.map(f => (
                      <tr key={f.id} style={{ borderBottom: '1px solid var(--border)' }}>
                        <td style={{ padding: '10px 16px' }}>
                          <div style={{ fontWeight: 500 }}>{f.student_name}</div>
                          <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{f.student_roll}</div>
                        </td>
                        <td style={{ padding: '10px 16px' }}>{f.fee_type}</td>
                        <td style={{ padding: '10px 16px', fontWeight: 600 }}>₹{Number(f.net_amount || f.amount).toLocaleString('en-IN')}</td>
                        <td style={{ padding: '10px 16px' }}>{f.due_date || '—'}</td>
                        <td style={{ padding: '10px 16px' }}>{f.paid_date || '—'}</td>
                        <td style={{ padding: '10px 16px' }}>
                          <span style={{
                            padding: '3px 10px', borderRadius: 999, fontSize: 12, fontWeight: 600,
                            background: f.status === 'paid' ? '#dcfce7' : f.status === 'overdue' ? '#fee2e2' : '#fef9c3',
                            color: f.status === 'paid' ? '#15803d' : f.status === 'overdue' ? '#dc2626' : '#92400e',
                          }}>{f.status}</span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
