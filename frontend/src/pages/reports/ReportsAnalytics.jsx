import { useState, useEffect } from 'react'
import api from '../../api/axios'

const Bar = ({ value, max, color = 'var(--primary)' }) => (
  <div style={{ height: 8, background: 'var(--border)', borderRadius: 4, overflow: 'hidden', marginTop: 4 }}>
    <div style={{ height: '100%', width: `${max ? Math.min((value / max) * 100, 100) : 0}%`, background: color, borderRadius: 4 }} />
  </div>
)

const StatCard = ({ label, value, color, sub }) => (
  <div className="card">
    <div className="card-body" style={{ textAlign: 'center', padding: '1rem' }}>
      <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{label}</div>
      <div style={{ fontSize: '1.6rem', fontWeight: 700, color: color || 'inherit', margin: '0.25rem 0' }}>{value}</div>
      {sub && <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>{sub}</div>}
    </div>
  </div>
)

export default function ReportsAnalytics() {
  const [overview, setOverview]   = useState(null)
  const [feeReport, setFeeReport] = useState(null)
  const [attReport, setAttReport] = useState(null)
  const [examReport, setExamReport] = useState(null)
  const [payReport, setPayReport] = useState(null)
  const [loading, setLoading]     = useState(true)

  useEffect(() => {
    setLoading(true)
    Promise.all([
      api.get('/reports/overview/'),
      api.get('/reports/fees/'),
      api.get('/reports/attendance/'),
      api.get('/reports/exams/'),
      api.get('/reports/payroll/'),
    ]).then(([o, f, a, e, p]) => {
      setOverview(o.data)
      setFeeReport(f.data)
      setAttReport(a.data)
      setExamReport(e.data)
      setPayReport(p.data)
    }).finally(() => setLoading(false))
  }, [])

  const fmt = (n) => '₹' + Number(n || 0).toLocaleString('en-IN', { minimumFractionDigits: 0 })

  if (loading) return <div className="page-container"><div className="loader" /></div>

  return (
    <div className="page-container">
      <div className="page-header">
        <div><h1 className="page-title">Reports & Analytics</h1><p className="page-subtitle">Institution-wide insights and statistics</p></div>
      </div>

      {/* ── Overview ── */}
      <p style={{ fontWeight: 700, marginBottom: '0.6rem', fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--text-muted)' }}>Institution Overview</p>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: '1rem', marginBottom: '1.5rem' }}>
        <StatCard label="Total Students" value={overview?.students?.total || 0} sub={`${overview?.students?.active || 0} active`} color="var(--primary)" />
        <StatCard label="Total Faculty"  value={overview?.faculty?.total || 0}  sub={`${overview?.faculty?.active || 0} active`} color="#7c3aed" />
        <StatCard label="Employees"      value={overview?.employees?.total || 0} sub={`${overview?.employees?.active || 0} active`} color="#0891b2" />
        <StatCard label="Hostel Allotments" value={overview?.hostel?.allotments || 0} color="#059669" />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: '1rem', marginBottom: '1.5rem' }}>
        <StatCard label="Exams Completed"  value={overview?.exams?.completed || 0}  sub={`of ${overview?.exams?.total || 0} total`} />
        <StatCard label="Placed Students"  value={overview?.placement?.selected || 0} color="var(--success)" />
        <StatCard label="Active Book Issues" value={overview?.library?.active_issues || 0} />
      </div>

      {/* ── Fee Report ── */}
      <p style={{ fontWeight: 700, marginBottom: '0.6rem', fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--text-muted)' }}>Fee Management</p>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: '1rem', marginBottom: '1.5rem' }}>
        <StatCard label="Total Collected" value={fmt(feeReport?.total_collected)} color="var(--success)" />
        <StatCard label="Pending"         value={fmt(feeReport?.total_pending)}   color="#f59e0b" />
        <StatCard label="Overdue"         value={fmt(feeReport?.total_overdue)}   color="var(--danger)" />
        <StatCard label="Total Records"   value={feeReport?.total_records || 0} />
      </div>

      {/* ── Attendance + Exam side by side ── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.5rem' }}>
        <div className="card">
          <div className="card-body">
            <p style={{ fontWeight: 600, marginBottom: '1rem' }}>Student Attendance</p>
            {[['Present', attReport?.present, attReport?.total, 'var(--success)'],
              ['Absent',  attReport?.absent,  attReport?.total, 'var(--danger)'],
              ['Late',    attReport?.late,    attReport?.total, '#f59e0b'],
            ].map(([l, v, t, c]) => (
              <div key={l} style={{ marginBottom: '0.75rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem' }}>
                  <span>{l}</span><span style={{ fontWeight: 600 }}>{v || 0}</span>
                </div>
                <Bar value={v || 0} max={t || 1} color={c} />
              </div>
            ))}
            <div style={{ marginTop: '0.75rem', padding: '0.5rem 0.75rem', background: 'var(--bg)', borderRadius: 6, display: 'flex', justifyContent: 'space-between', fontSize: '0.875rem' }}>
              <span>Overall Attendance Rate</span>
              <strong style={{ color: (attReport?.attendance_rate || 0) >= 75 ? 'var(--success)' : 'var(--danger)' }}>{attReport?.attendance_rate || 0}%</strong>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="card-body">
            <p style={{ fontWeight: 600, marginBottom: '1rem' }}>Examination Results</p>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginBottom: '1rem' }}>
              <div style={{ textAlign: 'center', padding: '0.75rem', background: 'var(--bg)', borderRadius: 8 }}>
                <div style={{ fontSize: '1.6rem', fontWeight: 700, color: 'var(--success)' }}>{examReport?.pass_count || 0}</div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Passed</div>
              </div>
              <div style={{ textAlign: 'center', padding: '0.75rem', background: 'var(--bg)', borderRadius: 8 }}>
                <div style={{ fontSize: '1.6rem', fontWeight: 700, color: 'var(--danger)' }}>{examReport?.fail_count || 0}</div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Failed</div>
              </div>
            </div>
            <p style={{ fontWeight: 600, marginBottom: '0.5rem', fontSize: '0.85rem' }}>Grade Distribution</p>
            {Object.entries(examReport?.grade_distribution || {}).map(([g, c]) => (
              <div key={g} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.3rem', fontSize: '0.8rem' }}>
                <span style={{ minWidth: 24, fontWeight: 700 }}>{g}</span>
                <div style={{ flex: 1, height: 6, background: 'var(--border)', borderRadius: 3, overflow: 'hidden' }}>
                  <div style={{ height: '100%', width: `${examReport?.total_results ? (c / examReport.total_results) * 100 : 0}%`, background: 'var(--primary)', borderRadius: 3 }} />
                </div>
                <span style={{ minWidth: 24, textAlign: 'right' }}>{c}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Payroll ── */}
      <p style={{ fontWeight: 700, marginBottom: '0.6rem', fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--text-muted)' }}>Payroll Summary</p>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: '1rem' }}>
        <StatCard label="Total Gross"      value={fmt(payReport?.total_gross)}      />
        <StatCard label="Total Net"        value={fmt(payReport?.total_net)}        color="var(--primary)" />
        <StatCard label="Total Deductions" value={fmt(payReport?.total_deductions)} color="var(--danger)" />
        <StatCard label="Paid Payrolls"    value={payReport?.paid || 0}            color="var(--success)" sub={`${payReport?.pending || 0} pending`} />
      </div>
    </div>
  )
}
