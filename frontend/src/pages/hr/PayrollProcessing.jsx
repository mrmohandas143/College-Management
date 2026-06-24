import React from 'react'
import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { processPayroll, getPayroll, markPayrollPaid } from '../../services/hrService'

const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December']
const fmt = (n) => '₹' + Number(n || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })
const pct = (part, whole) => whole ? ((Number(part) / Number(whole)) * 100).toFixed(1) + '%' : '0%'

const SummaryCard = ({ label, value, color, sub }) => (
  <div className="card">
    <div className="card-body" style={{ textAlign: 'center', padding: '1rem' }}>
      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.25rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{label}</div>
      <div style={{ fontSize: '1.35rem', fontWeight: 700, color: color || 'inherit' }}>{value}</div>
      {sub && <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '0.15rem' }}>{sub}</div>}
    </div>
  </div>
)

export default function PayrollProcessing() {
  const [month, setMonth]           = useState(new Date().getMonth() + 1)
  const [year, setYear]             = useState(new Date().getFullYear())
  const [workingDays, setWorkingDays] = useState(26)
  const [processing, setProcessing] = useState(false)
  const [payrolls, setPayrolls]     = useState([])
  const [loaded, setLoaded]         = useState(false)
  const [expanded, setExpanded]     = useState(null)   // row id with open breakdown
  const navigate = useNavigate()

  const handleProcess = async () => {
    if (!confirm(`Run payroll for ${MONTHS[month - 1]} ${year}?\nThis will recalculate all active employees.`)) return
    setProcessing(true)
    try {
      const res = await processPayroll({ month, year, working_days: workingDays })
      setPayrolls(res.data.payrolls)
      setLoaded(true)
    } finally { setProcessing(false) }
  }

  const handleLoad = async () => {
    setProcessing(true)
    const res = await getPayroll({ month, year })
    setPayrolls(res.data.results ?? res.data)
    setLoaded(true)
    setProcessing(false)
  }

  const handleMarkPaid = async (id) => {
    const today = new Date().toISOString().split('T')[0]
    await markPayrollPaid(id, today)
    setPayrolls(prev => prev.map(p => p.id === id ? { ...p, status: 'paid', paid_on: today } : p))
  }

  const handleMarkAllPaid = async () => {
    const today   = new Date().toISOString().split('T')[0]
    const pending = payrolls.filter(p => p.status === 'processed')
    await Promise.all(pending.map(p => markPayrollPaid(p.id, today)))
    setPayrolls(prev => prev.map(p => p.status === 'processed' ? { ...p, status: 'paid', paid_on: today } : p))
  }

  const sum = (key) => payrolls.reduce((s, p) => s + Number(p[key] || 0), 0)

  const statusBadge = (s) => {
    const c = { draft: 'secondary', processed: 'warning', paid: 'success' }
    return <span className={`badge badge-${c[s]}`}>{s}</span>
  }


  return (
    <div className="page-container">
      <div className="page-header">
        <div>
          <h1 className="page-title">Payroll Processing</h1>
          <p className="page-subtitle">Calculate and disburse monthly salaries</p>
        </div>
        <button className="btn btn-outline" onClick={() => navigate('/hr/employees')}>← Employees</button>
      </div>

      {/* Controls */}
      <div className="card" style={{ marginBottom: '1.25rem' }}>
        <div className="card-body">
          <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', alignItems: 'flex-end' }}>
            <div className="form-group" style={{ margin: 0 }}>
              <label className="form-label">Month</label>
              <select className="form-control" value={month} onChange={e => setMonth(Number(e.target.value))}>
                {MONTHS.map((m, i) => <option key={i} value={i + 1}>{m}</option>)}
              </select>
            </div>
            <div className="form-group" style={{ margin: 0 }}>
              <label className="form-label">Year</label>
              <input className="form-control" type="number" value={year} onChange={e => setYear(Number(e.target.value))} style={{ width: 90 }} />
            </div>
            <div className="form-group" style={{ margin: 0 }}>
              <label className="form-label">Working Days</label>
              <input className="form-control" type="number" min={1} max={31} value={workingDays} onChange={e => setWorkingDays(Number(e.target.value))} style={{ width: 90 }} />
            </div>
            <button className="btn btn-outline" onClick={handleLoad} disabled={processing}>Load Existing</button>
            <button className="btn btn-primary" onClick={handleProcess} disabled={processing}>
              {processing ? 'Processing…' : '⚙ Run Payroll'}
            </button>
          </div>
        </div>
      </div>

      {loaded && payrolls.length === 0 && (
        <div className="card">
          <div className="card-body" style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '2rem' }}>
            No payroll records for {MONTHS[month - 1]} {year}.
          </div>
        </div>
      )}

      {loaded && payrolls.length > 0 && (
        <>
          {/* Summary cards */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: '1rem', marginBottom: '1.25rem' }}>
            <SummaryCard label="Employees" value={payrolls.length} />
            <SummaryCard label="Total Gross" value={fmt(sum('gross_salary'))} />
            <SummaryCard label="Total Deductions" value={fmt(sum('total_deductions'))} color="var(--danger)" />
            <SummaryCard
              label="Net Payable"
              value={fmt(sum('net_salary'))}
              color="var(--primary)"
              sub={`${payrolls.filter(p => p.status === 'paid').length} paid · ${payrolls.filter(p => p.status === 'processed').length} pending`}
            />
          </div>

          {/* Deduction breakdown summary */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: '1rem', marginBottom: '1.25rem' }}>
            <SummaryCard label="Total PF" value={fmt(sum('pf_deduction'))} />
            <SummaryCard label="Total Tax" value={fmt(sum('tax_deduction'))} />
            <SummaryCard label="Absent Deductions" value={fmt(sum('absent_deduction'))} />
          </div>

          {/* Table */}
          <div className="card">
            <div className="card-body">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                <p style={{ fontWeight: 600, margin: 0 }}>{MONTHS[month - 1]} {year} — Payroll Register</p>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <button className="btn btn-sm btn-success" onClick={handleMarkAllPaid}>Mark All Paid</button>
                  <button className="btn btn-sm btn-outline" onClick={() => navigate('/hr/reports')}>Reports →</button>
                </div>
              </div>

              <div className="table-responsive">
                <table className="table">
                  <thead>
                    <tr>
                      <th></th>
                      <th>Employee</th>
                      <th>Dept</th>
                      <th style={{ textAlign: 'center' }}>Present</th>
                      <th style={{ textAlign: 'center' }}>½ Day</th>
                      <th style={{ textAlign: 'center' }}>Leave</th>
                      <th style={{ textAlign: 'center' }}>Absent</th>
                      <th style={{ textAlign: 'right' }}>Basic</th>
                      <th style={{ textAlign: 'right' }}>Gross</th>
                      <th style={{ textAlign: 'right' }}>Deductions</th>
                      <th style={{ textAlign: 'right' }}>Net</th>
                      <th>Status</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {payrolls.map(p => (
                      <React.Fragment key={p.id}>
                        <tr key={p.id} style={{ cursor: 'pointer' }}>
                          <td onClick={() => setExpanded(expanded === p.id ? null : p.id)}
                              style={{ color: 'var(--primary)', fontWeight: 700, userSelect: 'none' }}>
                            {expanded === p.id ? '▾' : '▸'}
                          </td>
                          <td>{p.employee_name}</td>
                          <td>{p.department_name || '—'}</td>
                          <td style={{ textAlign: 'center' }}>{p.present_days}</td>
                          <td style={{ textAlign: 'center' }}>{p.half_day}</td>
                          <td style={{ textAlign: 'center' }}>{p.leave_days}</td>
                          <td style={{ textAlign: 'center' }}>
                            {p.absent_days > 0
                              ? <span className="badge badge-danger">{p.absent_days}</span>
                              : <span className="badge badge-success">0</span>}
                          </td>
                          <td style={{ textAlign: 'right' }}>{fmt(p.basic_salary)}</td>
                          <td style={{ textAlign: 'right' }}>{fmt(p.gross_salary)}</td>
                          <td style={{ textAlign: 'right', color: 'var(--danger)' }}>{fmt(p.total_deductions)}</td>
                          <td style={{ textAlign: 'right', fontWeight: 700, color: 'var(--primary)' }}>{fmt(p.net_salary)}</td>
                          <td>{statusBadge(p.status)}</td>
                          <td>
                            <div style={{ display: 'flex', gap: '0.25rem' }}>
                              {p.status === 'processed' && (
                                <button className="btn btn-sm btn-success" onClick={() => handleMarkPaid(p.id)}>Pay</button>
                              )}
                              <button className="btn btn-sm btn-outline" onClick={() => navigate(`/hr/payslip/${p.id}`)}>Slip</button>
                            </div>
                          </td>
                        </tr>

                        {/* Inline salary breakdown */}
                        {expanded === p.id && (
                          <tr key={`${p.id}-breakdown`}>
                            <td colSpan={13} style={{ background: 'var(--bg)', padding: '1rem 1.5rem' }}>
                              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', maxWidth: 700 }}>
                                {/* Earnings */}
                                <div>
                                  <p style={{ fontWeight: 600, marginBottom: '0.5rem', fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Earnings</p>
                                  {[
                                    ['Basic Salary',      fmt(p.basic_salary),      ''],
                                    [`HRA (${p.hra_pct}% of Basic)`,  fmt(p.hra),   pct(p.hra, p.gross_salary)],
                                    [`TA (${p.ta_pct}% of Basic)`,    fmt(p.ta),    pct(p.ta, p.gross_salary)],
                                    ['Other Allowances',  fmt(p.other_allowances),  pct(p.other_allowances, p.gross_salary)],
                                  ].map(([label, value, share]) => (
                                    <div key={label} style={{ display: 'flex', justifyContent: 'space-between', padding: '0.25rem 0', fontSize: '0.875rem', borderBottom: '1px solid var(--border)' }}>
                                      <span style={{ color: 'var(--text-muted)' }}>{label}</span>
                                      <span>{value} {share && <span style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>({share})</span>}</span>
                                    </div>
                                  ))}
                                  <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.4rem 0', fontWeight: 700, fontSize: '0.9rem' }}>
                                    <span>Gross Salary</span><span style={{ color: 'var(--primary)' }}>{fmt(p.gross_salary)}</span>
                                  </div>
                                </div>

                                {/* Deductions */}
                                <div>
                                  <p style={{ fontWeight: 600, marginBottom: '0.5rem', fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Deductions</p>
                                  {[
                                    [`PF (${p.pf_pct}% of Basic)`,   fmt(p.pf_deduction),    ''],
                                    [`Tax (${p.tax_pct}% of Gross)`,  fmt(p.tax_deduction),   ''],
                                    [`Absent (${p.absent_days} days × ${fmt(Number(p.basic_salary) / p.working_days)})`, fmt(p.absent_deduction), ''],
                                    ['Other Deductions',              fmt(p.other_deductions), ''],
                                  ].map(([label, value]) => (
                                    <div key={label} style={{ display: 'flex', justifyContent: 'space-between', padding: '0.25rem 0', fontSize: '0.875rem', borderBottom: '1px solid var(--border)' }}>
                                      <span style={{ color: 'var(--text-muted)' }}>{label}</span>
                                      <span style={{ color: 'var(--danger)' }}>{value}</span>
                                    </div>
                                  ))}
                                  <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.4rem 0', fontWeight: 700, fontSize: '0.9rem' }}>
                                    <span>Total Deductions</span><span style={{ color: 'var(--danger)' }}>{fmt(p.total_deductions)}</span>
                                  </div>
                                </div>
                              </div>

                              {/* Net bar */}
                              <div style={{ marginTop: '0.75rem', padding: '0.6rem 1rem', background: 'var(--primary)', borderRadius: 6, display: 'flex', justifyContent: 'space-between', color: '#fff', maxWidth: 700 }}>
                                <span style={{ fontWeight: 600 }}>Net Salary = Gross − Deductions</span>
                                <span style={{ fontWeight: 700, fontSize: '1.05rem' }}>{fmt(p.gross_salary)} − {fmt(p.total_deductions)} = {fmt(p.net_salary)}</span>
                              </div>
                            </td>
                          </tr>
                        )}
                      </React.Fragment>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
