import { useEffect, useState } from 'react'
import api from '../../api/axios'
import Loader from '../../components/Loader'
import { formatDate, formatCurrency, statusBadge } from '../../utils/helpers'
import { jsPDF } from 'jspdf'
import autoTable from 'jspdf-autotable'
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts'

function downloadReceipt(fee) {
  const doc = new jsPDF({ unit: 'mm', format: 'a5' })
  const pageW = doc.internal.pageSize.getWidth()
  doc.setFillColor(37, 99, 235)
  doc.rect(0, 0, pageW, 28, 'F')
  doc.setTextColor(255, 255, 255)
  doc.setFontSize(16); doc.setFont('helvetica', 'bold')
  doc.text('CollegeMS', pageW / 2, 11, { align: 'center' })
  doc.setFontSize(9); doc.setFont('helvetica', 'normal')
  doc.text('Fee Payment Receipt', pageW / 2, 18, { align: 'center' })
  doc.text('College Management System', pageW / 2, 24, { align: 'center' })
  doc.setTextColor(30, 30, 30)
  doc.setFontSize(8); doc.setFont('helvetica', 'bold')
  doc.text(`Receipt No: ${fee.receipt_number || `RCP-${fee.id}`}`, 10, 36)
  doc.text(`Date: ${formatDate(fee.paid_date || new Date().toISOString())}`, pageW - 10, 36, { align: 'right' })
  doc.setDrawColor(220, 220, 220); doc.line(10, 39, pageW - 10, 39)
  doc.setFont('helvetica', 'bold'); doc.setFontSize(9)
  doc.text('Student Details', 10, 46)
  doc.setFont('helvetica', 'normal'); doc.setFontSize(8.5)
  doc.text('Name:', 10, 53); doc.setFont('helvetica', 'bold')
  doc.text(fee.student_name || '—', 35, 53)
  doc.setFont('helvetica', 'normal')
  doc.text('Roll No:', 10, 59); doc.text(fee.student_roll || '—', 35, 59)
  doc.text('Course:', 10, 65); doc.text(fee.student_course || '—', 35, 65)
  doc.setFont('helvetica', 'bold'); doc.setFontSize(9)
  doc.text('Fee Details', 10, 74)
  autoTable(doc, {
    startY: 77, margin: { left: 10, right: 10 },
    head: [['Description', 'Amount']],
    body: [
      [fee.fee_type, formatCurrency(fee.amount)],
      ...(Number(fee.discount_amount) > 0 ? [['Discount', `- ${formatCurrency(fee.discount_amount)}`]] : []),
      ...(Number(fee.fine_amount) > 0 ? [['Fine', `+ ${formatCurrency(fee.fine_amount)}`]] : []),
    ],
    foot: [['Net Payable', formatCurrency(fee.net_amount || fee.amount)]],
    headStyles: { fillColor: [37, 99, 235], fontSize: 8, fontStyle: 'bold' },
    footStyles: { fillColor: [240, 245, 255], textColor: [37, 99, 235], fontStyle: 'bold', fontSize: 9 },
    bodyStyles: { fontSize: 8 },
  })
  const y = doc.lastAutoTable.finalY + 8
  doc.setFont('helvetica', 'normal'); doc.setFontSize(8)
  doc.text(`Payment Mode: ${fee.payment_mode || 'Cash'}`, 10, y)
  doc.text(`Academic Year: ${fee.academic_year || '—'}`, 10, y + 6)
  const sc = fee.status === 'paid' ? [34, 197, 94] : [239, 68, 68]
  doc.setFillColor(...sc)
  doc.roundedRect(pageW / 2 - 18, y + 10, 36, 9, 2, 2, 'F')
  doc.setTextColor(255, 255, 255); doc.setFont('helvetica', 'bold'); doc.setFontSize(8)
  doc.text(fee.status.toUpperCase(), pageW / 2, y + 16, { align: 'center' })
  doc.setTextColor(150, 150, 150); doc.setFont('helvetica', 'normal'); doc.setFontSize(7)
  const pH = doc.internal.pageSize.getHeight()
  doc.line(10, pH - 12, pageW - 10, pH - 12)
  doc.text('This is a computer-generated receipt. No signature required.', pageW / 2, pH - 8, { align: 'center' })
  doc.save(`Receipt_${fee.fee_type?.replace(/\s+/g, '_')}_${fee.id}.pdf`)
}

export default function StudentFeeDashboard() {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState('overview')
  const [semFilter, setSemFilter] = useState('')

  useEffect(() => {
    // Get the student linked to the logged-in user
    api.get('/students/').then(r => {
      const student = r.data[0]
      if (!student) { setLoading(false); return }
      api.get(`/fees/student/${student.id}/`).then(fr => {
        setData({ student, ...fr.data })
      }).finally(() => setLoading(false))
    }).catch(() => setLoading(false))
  }, [])

  if (loading) return <Loader />
  if (!data) return (
    <div className="empty-state" style={{ paddingTop: 80 }}>
      <p>No student record linked to your account. Contact administrator.</p>
    </div>
  )

  const { student, fees, summary } = data

  const paid = fees.filter(f => f.status === 'paid')
  const pending = fees.filter(f => f.status === 'pending')
  const overdue = fees.filter(f => f.status === 'overdue')

  // Semester-wise grouping
  const semGroups = fees.reduce((acc, f) => {
    const key = f.semester ? `Semester ${f.semester}` : 'General'
    if (!acc[key]) acc[key] = []
    acc[key].push(f)
    return acc
  }, {})

  const semChartData = Object.entries(semGroups).map(([sem, flist]) => ({
    sem,
    total: flist.reduce((s, f) => s + Number(f.amount), 0),
    paid: flist.filter(f => f.status === 'paid').reduce((s, f) => s + Number(f.net_amount || f.amount), 0),
    pending: flist.filter(f => f.status !== 'paid').reduce((s, f) => s + Number(f.net_amount || f.amount), 0),
  }))

  const pieData = [
    { name: 'Paid', value: Number(summary.paid), color: '#22c55e' },
    { name: 'Pending', value: Number(summary.pending), color: '#f59e0b' },
  ].filter(d => d.value > 0)

  const filteredFees = semFilter
    ? fees.filter(f => (f.semester ? `Semester ${f.semester}` : 'General') === semFilter)
    : fees

  const collectionPct = summary.total > 0
    ? Math.round((summary.paid / summary.total) * 100)
    : 0

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

      {/* Header */}
      <div className="page-header" style={{ marginBottom: 0 }}>
        <div>
          <h1>My Fee Dashboard</h1>
          <p>{student.first_name} {student.last_name} · {student.course} · Roll: {student.roll_number}</p>
        </div>
        <span className="badge badge-info" style={{ fontSize: 13, padding: '6px 14px' }}>
          Academic Year: 2024-25
        </span>
      </div>

      {/* KPI Cards */}
      <div className="stats-grid">
        {[
          { label: 'Total Fees', value: formatCurrency(summary.total), color: '#2563eb', icon: '💰', sub: `${fees.length} records` },
          { label: 'Amount Paid', value: formatCurrency(summary.paid), color: '#22c55e', icon: '✅', sub: `${paid.length} paid` },
          { label: 'Amount Pending', value: formatCurrency(summary.pending), color: '#f59e0b', icon: '⏳', sub: `${pending.length + overdue.length} unpaid` },
          { label: 'Collection Rate', value: `${collectionPct}%`, color: '#7c3aed', icon: '📊', sub: 'Paid vs total' },
        ].map(k => (
          <div key={k.label} className="stat-card" style={{ borderTop: `3px solid ${k.color}` }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <div className="stat-value" style={{ color: k.color }}>{k.value}</div>
                <div className="stat-label">{k.label}</div>
                <div className="stat-sub">{k.sub}</div>
              </div>
              <span style={{ fontSize: 26 }}>{k.icon}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Progress Bar */}
      <div className="card">
        <div className="card-body" style={{ padding: '14px 20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
            <span style={{ fontWeight: 600, fontSize: 14 }}>Overall Payment Progress</span>
            <span style={{ fontWeight: 700, color: '#22c55e' }}>{collectionPct}% Paid</span>
          </div>
          <div style={{ background: '#f3f4f6', borderRadius: 999, height: 14, overflow: 'hidden' }}>
            <div style={{
              width: `${collectionPct}%`, height: '100%', borderRadius: 999,
              background: 'linear-gradient(90deg, #22c55e, #16a34a)', transition: 'width 0.6s ease'
            }} />
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 5, fontSize: 12, color: 'var(--text-muted)' }}>
            <span>Paid: {formatCurrency(summary.paid)}</span>
            <span>Remaining: {formatCurrency(summary.pending)}</span>
            <span>Total: {formatCurrency(summary.total)}</span>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="card">
        <div style={{ display: 'flex', borderBottom: '1px solid var(--border)', padding: '0 20px' }}>
          {['overview', 'semester-wise', 'all fees'].map(t => (
            <button key={t} onClick={() => setTab(t)} style={{
              padding: '12px 16px', border: 'none', background: 'none', cursor: 'pointer',
              fontWeight: 500, fontSize: 13, textTransform: 'capitalize',
              color: tab === t ? 'var(--primary)' : 'var(--text-muted)',
              borderBottom: tab === t ? '2px solid var(--primary)' : '2px solid transparent',
              marginBottom: -1,
            }}>{t}</button>
          ))}
        </div>

        {/* Overview Tab */}
        {tab === 'overview' && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 0 }}>
            {/* Pie chart */}
            <div style={{ padding: 20, borderRight: '1px solid var(--border)' }}>
              <div style={{ fontWeight: 600, marginBottom: 12 }}>Payment Breakdown</div>
              {pieData.length > 0 ? (
                <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                  <ResponsiveContainer width="55%" height={180}>
                    <PieChart>
                      <Pie data={pieData} cx="50%" cy="50%" innerRadius={45} outerRadius={75}
                        dataKey="value" paddingAngle={3}>
                        {pieData.map((e, i) => <Cell key={i} fill={e.color} />)}
                      </Pie>
                      <Tooltip formatter={v => formatCurrency(v)} contentStyle={{ borderRadius: 8, fontSize: 12 }} />
                    </PieChart>
                  </ResponsiveContainer>
                  <div style={{ flex: 1 }}>
                    {pieData.map(d => (
                      <div key={d.name} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
                        <div style={{ width: 12, height: 12, borderRadius: 3, background: d.color }} />
                        <div>
                          <div style={{ fontWeight: 600, fontSize: 13 }}>{d.name}</div>
                          <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{formatCurrency(d.value)}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="empty-state" style={{ padding: 30 }}><p>No fee data</p></div>
              )}
            </div>

            {/* Upcoming dues */}
            <div style={{ padding: 20 }}>
              <div style={{ fontWeight: 600, marginBottom: 12 }}>Upcoming / Overdue</div>
              {[...pending, ...overdue].length === 0 ? (
                <div style={{ textAlign: 'center', padding: 30, color: 'var(--text-muted)' }}>
                  <div style={{ fontSize: 28, marginBottom: 8 }}>🎉</div>
                  <div style={{ fontWeight: 600 }}>All fees paid!</div>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {[...overdue, ...pending].slice(0, 5).map(f => (
                    <div key={f.id} style={{
                      display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                      padding: '10px 12px', borderRadius: 8,
                      background: f.status === 'overdue' ? '#fef2f2' : '#fffbeb',
                      border: `1px solid ${f.status === 'overdue' ? '#fecaca' : '#fde68a'}`
                    }}>
                      <div>
                        <div style={{ fontWeight: 600, fontSize: 13 }}>{f.fee_type}</div>
                        <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>Due: {formatDate(f.due_date)}</div>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <div style={{ fontWeight: 700, color: f.status === 'overdue' ? '#dc2626' : '#d97706' }}>
                          {formatCurrency(f.net_amount || f.amount)}
                        </div>
                        <span className={`badge ${f.status === 'overdue' ? 'badge-danger' : 'badge-warning'}`}>
                          {f.status}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Semester-wise Tab */}
        {tab === 'semester-wise' && (
          <div style={{ padding: 20 }}>
            {semChartData.length > 0 && (
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={semChartData} margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="sem" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} tickFormatter={v => `₹${(v / 1000).toFixed(0)}k`} />
                  <Tooltip formatter={v => formatCurrency(v)} contentStyle={{ borderRadius: 8, fontSize: 12 }} />
                  <Bar dataKey="paid" name="Paid" fill="#22c55e" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="pending" name="Pending" fill="#f59e0b" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginTop: 16 }}>
              {Object.entries(semGroups).map(([sem, flist]) => {
                const semPaid = flist.filter(f => f.status === 'paid').reduce((s, f) => s + Number(f.net_amount || f.amount), 0)
                const semTotal = flist.reduce((s, f) => s + Number(f.amount), 0)
                const pct = semTotal > 0 ? Math.round(semPaid / semTotal * 100) : 0
                return (
                  <div key={sem} style={{ border: '1px solid var(--border)', borderRadius: 8, padding: '14px 16px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                      <div style={{ fontWeight: 700 }}>{sem}</div>
                      <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>{flist.length} fees · {pct}% paid</div>
                    </div>
                    <div style={{ display: 'flex', gap: 16, marginBottom: 8 }}>
                      <span style={{ fontSize: 13 }}>Total: <strong>{formatCurrency(semTotal)}</strong></span>
                      <span style={{ fontSize: 13, color: '#22c55e' }}>Paid: <strong>{formatCurrency(semPaid)}</strong></span>
                      <span style={{ fontSize: 13, color: '#f59e0b' }}>Pending: <strong>{formatCurrency(semTotal - semPaid)}</strong></span>
                    </div>
                    <div style={{ background: '#f3f4f6', borderRadius: 999, height: 8 }}>
                      <div style={{ width: `${pct}%`, height: '100%', borderRadius: 999, background: '#22c55e' }} />
                    </div>
                    <div style={{ display: 'flex', gap: 6, marginTop: 10, flexWrap: 'wrap' }}>
                      {flist.map(f => (
                        <span key={f.id} className={`badge ${statusBadge(f.status)}`} style={{ fontSize: 11 }}>
                          {f.fee_type}: {formatCurrency(f.net_amount || f.amount)}
                        </span>
                      ))}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* All Fees Tab */}
        {tab === 'all fees' && (
          <div>
            <div className="toolbar">
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>Filter:</span>
                <select value={semFilter} onChange={e => setSemFilter(e.target.value)}
                  style={{ width: 160, padding: '5px 10px' }}>
                  <option value="">All Semesters</option>
                  {Object.keys(semGroups).map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
              <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>{filteredFees.length} records</span>
            </div>
            {filteredFees.length === 0 ? (
              <div className="empty-state"><p>No fee records found</p></div>
            ) : (
              <div className="table-wrap">
                <table>
                  <thead>
                    <tr><th>Fee Type</th><th>Semester</th><th>Amount</th><th>Net Payable</th><th>Due Date</th><th>Paid Date</th><th>Status</th><th>Receipt</th></tr>
                  </thead>
                  <tbody>
                    {filteredFees.map(f => (
                      <tr key={f.id}>
                        <td style={{ fontWeight: 600 }}>{f.fee_type}</td>
                        <td>{f.semester ? `Sem ${f.semester}` : <span style={{ color: 'var(--text-muted)' }}>—</span>}</td>
                        <td>{formatCurrency(f.amount)}</td>
                        <td style={{ fontWeight: 700, color: 'var(--primary)' }}>{formatCurrency(f.net_amount || f.amount)}</td>
                        <td>{formatDate(f.due_date)}</td>
                        <td>{formatDate(f.paid_date)}</td>
                        <td><span className={`badge ${statusBadge(f.status)}`}>{f.status}</span></td>
                        <td>
                          {f.status === 'paid'
                            ? <button onClick={() => downloadReceipt(f)} className="btn btn-outline btn-sm" style={{ color: 'var(--primary)' }}>⬇ PDF</button>
                            : <span style={{ color: 'var(--text-muted)', fontSize: 12 }}>—</span>
                          }
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
