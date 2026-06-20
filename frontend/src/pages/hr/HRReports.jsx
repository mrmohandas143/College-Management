import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { getPayrollAnalytics } from '../../services/hrService'

const MONTHS = ['','January','February','March','April','May','June','July','August','September','October','November','December']
const fmt    = (n) => '₹' + Number(n || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })

const Bar = ({ value, max, color = 'var(--primary)' }) => (
  <div style={{ height: 8, background: 'var(--border)', borderRadius: 4, overflow: 'hidden' }}>
    <div style={{ height: '100%', width: `${max ? (value / max) * 100 : 0}%`, background: color, borderRadius: 4, transition: 'width 0.4s ease' }} />
  </div>
)

export default function HRReports() {
  const [month, setMonth]       = useState(new Date().getMonth() + 1)
  const [year, setYear]         = useState(new Date().getFullYear())
  const [data, setData]         = useState(null)
  const [loading, setLoading]   = useState(false)
  const navigate = useNavigate()

  const load = async (m = month, y = year) => {
    setLoading(true)
    try {
      const res = await getPayrollAnalytics({ month: m, year: y })
      setData(res.data)
    } finally { setLoading(false) }
  }

  useEffect(() => { load() }, [])

  const StatCard = ({ label, value, sub, color, icon }) => (
    <div className="card">
      <div className="card-body" style={{ padding: '1rem 1.25rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '0.3rem' }}>{label}</div>
            <div style={{ fontSize: '1.4rem', fontWeight: 700, color: color || 'inherit' }}>{value}</div>
            {sub && <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>{sub}</div>}
          </div>
          {icon && <div style={{ fontSize: '1.5rem', opacity: 0.25 }}>{icon}</div>}
        </div>
      </div>
    </div>
  )

  return (
    <div className="page-container">
      <div className="page-header">
        <div>
          <h1 className="page-title">HR Reports & Analytics</h1>
          <p className="page-subtitle">Workforce and payroll insights</p>
        </div>
        <button className="btn btn-outline" onClick={() => navigate('/hr/payroll')}>← Payroll</button>
      </div>

      {/* Filter bar */}
      <div className="card" style={{ marginBottom: '1.25rem' }}>
        <div className="card-body">
          <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', alignItems: 'flex-end' }}>
            <div className="form-group" style={{ margin: 0 }}>
              <label className="form-label">Month</label>
              <select className="form-control" value={month} onChange={e => setMonth(Number(e.target.value))}>
                {MONTHS.slice(1).map((m, i) => <option key={i + 1} value={i + 1}>{m}</option>)}
              </select>
            </div>
            <div className="form-group" style={{ margin: 0 }}>
              <label className="form-label">Year</label>
              <input className="form-control" type="number" value={year} onChange={e => setYear(Number(e.target.value))} style={{ width: 100 }} />
            </div>
            <button className="btn btn-primary" onClick={() => load(month, year)} disabled={loading}>
              {loading ? 'Loading…' : 'Generate Report'}
            </button>
          </div>
        </div>
      </div>

      {loading && <div className="loader" />}

      {data && !loading && (
        <>
          {/* ── Workforce ── */}
          <p style={{ fontWeight: 700, marginBottom: '0.6rem', fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--text-muted)' }}>Workforce</p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: '1rem', marginBottom: '1.5rem' }}>
            <StatCard label="Total Employees"  value={data.employee_total}  icon="👥" />
            <StatCard label="Active"           value={data.employee_active} color="var(--success)" icon="✅" />
            <StatCard label="Payrolls Processed" value={data.payroll_count} icon="📋" />
            <StatCard label="Paid"             value={data.paid_count}
              sub={`${data.pending_count} pending`} color="var(--success)" icon="💰" />
          </div>

          {/* ── Payroll Summary ── */}
          <p style={{ fontWeight: 700, marginBottom: '0.6rem', fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--text-muted)' }}>
            Payroll — {MONTHS[month]} {year}
          </p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5,1fr)', gap: '1rem', marginBottom: '1.5rem' }}>
            <StatCard label="Total Gross"       value={fmt(data.total_gross)}       icon="📈" />
            <StatCard label="Total Net"         value={fmt(data.total_net)}         color="var(--primary)" icon="💵" />
            <StatCard label="Total Deductions"  value={fmt(data.total_deductions)}  color="var(--danger)" icon="📉" />
            <StatCard label="Total PF"          value={fmt(data.total_pf)}          icon="🏦" />
            <StatCard label="Total Tax"         value={fmt(data.total_tax)}         icon="🧾" />
          </div>

          {/* ── Salary formula reminder ── */}
          <div style={{ background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: 8, padding: '0.75rem 1.25rem', marginBottom: '1.5rem', fontSize: '0.85rem', display: 'flex', gap: '2rem', flexWrap: 'wrap' }}>
            <span><strong>Gross</strong> = Basic + HRA + TA + Other Allowances</span>
            <span><strong>Deductions</strong> = PF + Tax + Absent Deduction + Other</span>
            <span><strong>Net</strong> = Gross − Total Deductions</span>
          </div>

          {/* ── Dept breakdown + Leave stats ── */}
          <div style={{ display: 'grid', gridTemplateColumns: '3fr 2fr', gap: '1rem', marginBottom: '1.5rem' }}>

            {/* Department breakdown */}
            <div className="card">
              <div className="card-body">
                <p style={{ fontWeight: 600, marginBottom: '1rem' }}>Net Salary by Department</p>
                {data.by_department.length === 0
                  ? <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>No data for this period.</p>
                  : (() => {
                    const maxNet = Math.max(...data.by_department.map(d => d.net))
                    return data.by_department
                      .sort((a, b) => b.net - a.net)
                      .map(d => (
                        <div key={d.department} style={{ marginBottom: '1rem' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', marginBottom: '0.3rem' }}>
                            <span style={{ fontWeight: 500 }}>{d.department}</span>
                            <span style={{ display: 'flex', gap: '1rem' }}>
                              <span style={{ color: 'var(--text-muted)', fontSize: '0.78rem' }}>{d.count} emp</span>
                              <span style={{ fontWeight: 600 }}>{fmt(d.net)}</span>
                            </span>
                          </div>
                          <Bar value={d.net} max={maxNet} />
                        </div>
                      ))
                  })()
                }
              </div>
            </div>

            {/* Leave stats */}
            <div className="card">
              <div className="card-body">
                <p style={{ fontWeight: 600, marginBottom: '1rem' }}>Leave Statistics — {MONTHS[month]} {year}</p>
                {Object.entries(data.leave_stats).map(([type, count]) => {
                  const total = Object.values(data.leave_stats).reduce((a, b) => a + b, 0)
                  const colors = { sick: '#e74c3c', casual: '#3498db', earned: '#27ae60', unpaid: '#f39c12' }
                  return (
                    <div key={type} style={{ marginBottom: '0.9rem' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', marginBottom: '0.3rem' }}>
                        <span style={{ textTransform: 'capitalize', fontWeight: 500 }}>{type} Leave</span>
                        <span style={{ fontWeight: 700 }}>{count}</span>
                      </div>
                      <Bar value={count} max={total || 1} color={colors[type]} />
                    </div>
                  )
                })}
                <div style={{ marginTop: '0.75rem', paddingTop: '0.75rem', borderTop: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem' }}>
                  <span style={{ color: 'var(--text-muted)' }}>Total Approved Leaves</span>
                  <span style={{ fontWeight: 700 }}>{Object.values(data.leave_stats).reduce((a, b) => a + b, 0)}</span>
                </div>
              </div>
            </div>
          </div>

          {/* ── 6-month trend ── */}
          <div className="card" style={{ marginBottom: '1.5rem' }}>
            <div className="card-body">
              <p style={{ fontWeight: 600, marginBottom: '1rem' }}>6-Month Net Salary Trend</p>
              {data.trend && data.trend.length > 0 ? (() => {
                const maxNet = Math.max(...data.trend.map(t => t.net))
                return (
                  <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'flex-end', height: 120 }}>
                    {data.trend.map(t => {
                      const h = maxNet ? Math.max(8, (t.net / maxNet) * 100) : 8
                      return (
                        <div key={t.label} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.3rem' }}>
                          <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', fontWeight: 600 }}>
                            {t.net > 0 ? '₹' + (t.net / 1000).toFixed(0) + 'K' : '—'}
                          </div>
                          <div style={{ width: '100%', height: `${h}px`, background: 'var(--primary)', borderRadius: '3px 3px 0 0', opacity: t.label.includes(String(month)) && t.label.includes(String(year)) ? 1 : 0.5 }} />
                          <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', textAlign: 'center' }}>{t.label}</div>
                        </div>
                      )
                    })}
                  </div>
                )
              })() : <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>No trend data.</p>}
            </div>
          </div>

          {/* Quick actions */}
          <div className="card">
            <div className="card-body">
              <p style={{ fontWeight: 600, marginBottom: '0.75rem' }}>Quick Actions</p>
              <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
                {[
                  ['Manage Employees', '/hr/employees'],
                  ['Attendance',       '/hr/attendance'],
                  ['Leave Requests',   '/hr/leaves'],
                  ['Process Payroll',  '/hr/payroll'],
                ].map(([label, path]) => (
                  <button key={path} className="btn btn-outline" onClick={() => navigate(path)}>{label}</button>
                ))}
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
