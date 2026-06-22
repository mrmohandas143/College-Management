import { useEffect, useState } from 'react'
import api from '../../api/axios'
import Loader from '../../components/Loader'
import { formatDate, formatCurrency, statusBadge } from '../../utils/helpers'
import { jsPDF } from 'jspdf'
import autoTable from 'jspdf-autotable'
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts'

function downloadReceipt(fee) {
  const doc = new jsPDF({ unit: 'mm', format: 'a5' })
  const W = doc.internal.pageSize.getWidth()
  doc.setFillColor(37, 99, 235); doc.rect(0, 0, W, 28, 'F')
  doc.setTextColor(255, 255, 255)
  doc.setFontSize(16); doc.setFont('helvetica', 'bold')
  doc.text('CollegeMS', W / 2, 11, { align: 'center' })
  doc.setFontSize(9); doc.setFont('helvetica', 'normal')
  doc.text('Fee Payment Receipt', W / 2, 18, { align: 'center' })
  doc.text('College Management System', W / 2, 24, { align: 'center' })
  doc.setTextColor(30, 30, 30); doc.setFontSize(8); doc.setFont('helvetica', 'bold')
  doc.text(`Receipt No: ${fee.receipt_number || `RCP-${fee.id}`}`, 10, 36)
  doc.text(`Date: ${formatDate(fee.paid_date || new Date().toISOString())}`, W - 10, 36, { align: 'right' })
  doc.setDrawColor(220, 220, 220); doc.line(10, 39, W - 10, 39)
  doc.setFont('helvetica', 'bold'); doc.setFontSize(9); doc.text('Student Details', 10, 46)
  doc.setFont('helvetica', 'normal'); doc.setFontSize(8.5)
  doc.text('Name:', 10, 53); doc.setFont('helvetica', 'bold'); doc.text(fee.student_name || '—', 35, 53)
  doc.setFont('helvetica', 'normal')
  doc.text('Roll No:', 10, 59); doc.text(fee.student_roll || '—', 35, 59)
  doc.text('Course:', 10, 65); doc.text(fee.student_course || '—', 35, 65)
  doc.setFont('helvetica', 'bold'); doc.setFontSize(9); doc.text('Fee Details', 10, 74)
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
  doc.roundedRect(W / 2 - 18, y + 10, 36, 9, 2, 2, 'F')
  doc.setTextColor(255, 255, 255); doc.setFont('helvetica', 'bold'); doc.setFontSize(8)
  doc.text(fee.status.toUpperCase(), W / 2, y + 16, { align: 'center' })
  doc.setTextColor(150, 150, 150); doc.setFont('helvetica', 'normal'); doc.setFontSize(7)
  const pH = doc.internal.pageSize.getHeight()
  doc.line(10, pH - 12, W - 10, pH - 12)
  doc.text('This is a computer-generated receipt. No signature required.', W / 2, pH - 8, { align: 'center' })
  doc.save(`Receipt_${fee.fee_type?.replace(/\s+/g, '_')}_${fee.id}.pdf`)
}

const TYPE_BADGE = {
  due_reminder: 'badge-warning', overdue: 'badge-danger',
  payment_confirm: 'badge-success', general: 'badge-info',
}
const TYPE_LABEL = {
  due_reminder: '⏰ Due Reminder', overdue: '🚨 Overdue',
  payment_confirm: '✅ Confirmed', general: '📢 General',
}

export default function ParentPortal() {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [tab, setTab] = useState('overview')
  const [allStudents, setAllStudents] = useState([])
  const [selectedStudent, setSelectedStudent] = useState('')
  const [linking, setLinking] = useState(false)

  const fetchPortalData = () => {
    api.get('/fees/parent-portal/').then(r => {
      setData(r.data)
      if (r.data.no_link) {
        api.get('/students/').then(res => {
          setAllStudents(res.data.results ?? res.data)
        }).catch(() => {})
      }
    }).catch(e => {
      setError(e.response?.data?.error || 'Failed to load portal data')
    }).finally(() => setLoading(false))
  }

  useEffect(() => {
    fetchPortalData()
  }, [])

  const handleLinkStudent = async (e) => {
    e.preventDefault()
    if (!selectedStudent) return
    setLinking(true)
    try {
      await api.post('/fees/parent-portal/', { student_id: selectedStudent })
      setLoading(true)
      fetchPortalData()
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to link student')
    } finally {
      setLinking(false)
    }
  }

  if (loading) return <Loader />
  if (error) return (
    <div className="empty-state" style={{ paddingTop: 80 }}>
      <div style={{ fontSize: 48, marginBottom: 12 }}>👨‍👩‍👧</div>
      <p style={{ fontSize: 15, fontWeight: 600 }}>{error}</p>
      <p style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 6 }}>
        Your account is not linked to any student. Contact the administrator.
      </p>
    </div>
  )

  if (data?.no_link) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '60vh', padding: 20 }}>
        <div className="card" style={{ width: '100%', maxWidth: 480, padding: '32px 24px' }}>
          <div style={{ textAlign: 'center', marginBottom: 24 }}>
            <span style={{ fontSize: 48 }}>👨‍👩‍👧</span>
            <h2 style={{ marginTop: 12, fontWeight: 800 }}>Link Your Child</h2>
            <p style={{ color: 'var(--text-muted)', fontSize: 13, marginTop: 4 }}>
              To view grades, attendance, and fees, link your parent account to your child's student record.
            </p>
          </div>

          <form onSubmit={handleLinkStudent}>
            <div className="form-group">
              <label className="form-label">Select Student</label>
              <select 
                value={selectedStudent} 
                onChange={e => setSelectedStudent(e.target.value)} 
                required
                style={{ padding: '10px 12px' }}
              >
                <option value="">-- Choose student --</option>
                {allStudents.map(s => (
                  <option key={s.id} value={s.id}>
                    {s.first_name} {s.last_name} ({s.roll_number || s.register_number} — {s.course})
                  </option>
                ))}
              </select>
            </div>

            <button 
              type="submit" 
              className="btn btn-primary" 
              style={{ width: '100%', justifyContent: 'center', marginTop: 12, height: 42 }}
              disabled={linking}
            >
              {linking ? 'Linking student...' : 'Link Student Account'}
            </button>
          </form>
        </div>
      </div>
    )
  }

  const { student, fees, notifications, summary } = data
  const paid = fees.filter(f => f.status === 'paid')
  const pending = fees.filter(f => f.status === 'pending')
  const overdue = fees.filter(f => f.status === 'overdue')
  const unread = notifications.filter(n => !n.is_read).length
  const collPct = summary.total > 0 ? Math.round((summary.paid / summary.total) * 100) : 0

  const pieData = [
    { name: 'Paid', value: Number(summary.paid), color: '#22c55e' },
    { name: 'Pending', value: Number(summary.pending), color: '#f59e0b' },
  ].filter(d => d.value > 0)

  // Semester grouping
  const semGroups = fees.reduce((acc, f) => {
    const key = f.semester ? `Semester ${f.semester}` : 'General'
    if (!acc[key]) acc[key] = []
    acc[key].push(f)
    return acc
  }, {})

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

      {/* Header */}
      <div className="page-header" style={{ marginBottom: 0 }}>
        <div>
          <h1>👨‍👩‍👧 Parent Portal</h1>
          <p>Monitoring fees & updates for your child</p>
        </div>
        {unread > 0 && (
          <div style={{ background: '#fef3c7', border: '1px solid #fde68a', borderRadius: 8, padding: '8px 16px', fontSize: 13, fontWeight: 600, color: '#b45309' }}>
            🔔 {unread} unread notification{unread > 1 ? 's' : ''}
          </div>
        )}
      </div>

      {/* Student Info Card */}
      <div className="card">
        <div className="profile-header">
          <div className="profile-avatar" style={{ width: 60, height: 60, fontSize: 22, background: '#7c3aed' }}>
            {student.first_name?.[0]}{student.last_name?.[0]}
          </div>
          <div className="profile-info">
            <h2>{student.first_name} {student.last_name}</h2>
            <p style={{ color: 'var(--text-muted)' }}>{student.email}</p>
            <div style={{ display: 'flex', gap: 8, marginTop: 6, flexWrap: 'wrap' }}>
              <span className="badge badge-info">{student.course}</span>
              <span className="badge badge-gray">Year {student.year}</span>
              <span className="badge badge-gray">Roll: {student.roll_number}</span>
              <span className={`badge ${student.status === 'active' ? 'badge-success' : 'badge-gray'}`}>{student.status}</span>
            </div>
          </div>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="stats-grid">
        {[
          { label: 'Total Fees', value: formatCurrency(summary.total), color: '#2563eb', icon: '💰', sub: `${fees.length} records` },
          { label: 'Amount Paid', value: formatCurrency(summary.paid), color: '#22c55e', icon: '✅', sub: `${paid.length} paid` },
          { label: 'Amount Pending', value: formatCurrency(summary.pending), color: '#f59e0b', icon: '⏳', sub: `${pending.length + overdue.length} unpaid` },
          { label: 'Overdue', value: overdue.length, color: '#ef4444', icon: '🚨', sub: overdue.length > 0 ? 'Needs attention' : 'All clear' },
          { label: 'Collection Rate', value: `${collPct}%`, color: '#7c3aed', icon: '📊', sub: 'Paid vs total' },
          { label: 'Notifications', value: notifications.length, color: '#0891b2', icon: '🔔', sub: `${unread} unread` },
        ].map(k => (
          <div key={k.label} className="stat-card" style={{ borderTop: `3px solid ${k.color}` }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <div className="stat-value" style={{ color: k.color, fontSize: 22 }}>{k.value}</div>
                <div className="stat-label">{k.label}</div>
                <div className="stat-sub">{k.sub}</div>
              </div>
              <span style={{ fontSize: 24 }}>{k.icon}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Progress Bar */}
      <div className="card">
        <div className="card-body" style={{ padding: '14px 20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
            <span style={{ fontWeight: 600, fontSize: 14 }}>Overall Fee Payment Progress</span>
            <span style={{ fontWeight: 700, color: collPct === 100 ? '#22c55e' : '#f59e0b' }}>{collPct}%</span>
          </div>
          <div style={{ background: '#f3f4f6', borderRadius: 999, height: 14, overflow: 'hidden' }}>
            <div style={{
              width: `${collPct}%`, height: '100%', borderRadius: 999,
              background: collPct === 100 ? 'linear-gradient(90deg,#22c55e,#16a34a)' : 'linear-gradient(90deg,#f59e0b,#d97706)',
              transition: 'width 0.6s ease'
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
          {['overview', 'fee details', 'semester-wise', 'notifications'].map(t => (
            <button key={t} onClick={() => setTab(t)} style={{
              padding: '12px 16px', border: 'none', background: 'none', cursor: 'pointer',
              fontWeight: 500, fontSize: 13, textTransform: 'capitalize',
              color: tab === t ? 'var(--primary)' : 'var(--text-muted)',
              borderBottom: tab === t ? '2px solid var(--primary)' : '2px solid transparent',
              marginBottom: -1, position: 'relative',
            }}>
              {t}
              {t === 'notifications' && unread > 0 && (
                <span style={{
                  position: 'absolute', top: 8, right: 4,
                  background: '#ef4444', color: '#fff', borderRadius: 999,
                  fontSize: 10, fontWeight: 700, padding: '1px 5px', lineHeight: 1.4
                }}>{unread}</span>
              )}
            </button>
          ))}
        </div>

        {/* Overview Tab */}
        {tab === 'overview' && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 0 }}>
            <div style={{ padding: 20, borderRight: '1px solid var(--border)' }}>
              <div style={{ fontWeight: 600, marginBottom: 12 }}>Payment Breakdown</div>
              {pieData.length > 0 ? (
                <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                  <ResponsiveContainer width="55%" height={180}>
                    <PieChart>
                      <Pie data={pieData} cx="50%" cy="50%" innerRadius={45} outerRadius={75} dataKey="value" paddingAngle={3}>
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
                <div className="empty-state" style={{ padding: 30 }}><p>No fee data yet</p></div>
              )}
            </div>

            <div style={{ padding: 20 }}>
              <div style={{ fontWeight: 600, marginBottom: 12 }}>Pending / Overdue Fees</div>
              {[...overdue, ...pending].length === 0 ? (
                <div style={{ textAlign: 'center', padding: 30, color: 'var(--text-muted)' }}>
                  <div style={{ fontSize: 32, marginBottom: 8 }}>🎉</div>
                  <div style={{ fontWeight: 600 }}>All fees are paid!</div>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {[...overdue, ...pending].slice(0, 6).map(f => (
                    <div key={f.id} style={{
                      display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                      padding: '10px 12px', borderRadius: 8,
                      background: f.status === 'overdue' ? '#fef2f2' : '#fffbeb',
                      border: `1px solid ${f.status === 'overdue' ? '#fecaca' : '#fde68a'}`
                    }}>
                      <div>
                        <div style={{ fontWeight: 600, fontSize: 13 }}>{f.fee_type}</div>
                        <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                          Due: {formatDate(f.due_date)}
                          {f.semester ? ` · Sem ${f.semester}` : ''}
                        </div>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <div style={{ fontWeight: 700, color: f.status === 'overdue' ? '#dc2626' : '#d97706' }}>
                          {formatCurrency(f.net_amount || f.amount)}
                        </div>
                        <span className={`badge ${f.status === 'overdue' ? 'badge-danger' : 'badge-warning'}`}>{f.status}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Fee Details Tab */}
        {tab === 'fee details' && (
          fees.length === 0 ? (
            <div className="empty-state"><p>No fee records found</p></div>
          ) : (
            <div className="table-wrap">
              <table>
                <thead>
                  <tr><th>Fee Type</th><th>Semester</th><th>Amount</th><th>Net Payable</th><th>Due Date</th><th>Paid Date</th><th>Status</th><th>Receipt</th></tr>
                </thead>
                <tbody>
                  {fees.map(f => (
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
          )
        )}

        {/* Semester-wise Tab */}
        {tab === 'semester-wise' && (
          <div style={{ padding: 20, display: 'flex', flexDirection: 'column', gap: 12 }}>
            {Object.keys(semGroups).length === 0 ? (
              <div className="empty-state"><p>No semester data</p></div>
            ) : Object.entries(semGroups).map(([sem, flist]) => {
              const semPaid = flist.filter(f => f.status === 'paid').reduce((s, f) => s + Number(f.net_amount || f.amount), 0)
              const semTotal = flist.reduce((s, f) => s + Number(f.amount), 0)
              const pct = semTotal > 0 ? Math.round(semPaid / semTotal * 100) : 0
              return (
                <div key={sem} style={{ border: '1px solid var(--border)', borderRadius: 10, padding: '16px 18px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                    <div style={{ fontWeight: 700, fontSize: 15 }}>{sem}</div>
                    <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                      <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>{flist.length} fees</span>
                      <span style={{ fontWeight: 700, color: pct === 100 ? '#22c55e' : '#f59e0b' }}>{pct}% paid</span>
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: 20, marginBottom: 10 }}>
                    <span style={{ fontSize: 13 }}>Total: <strong>{formatCurrency(semTotal)}</strong></span>
                    <span style={{ fontSize: 13, color: '#22c55e' }}>Paid: <strong>{formatCurrency(semPaid)}</strong></span>
                    <span style={{ fontSize: 13, color: '#f59e0b' }}>Pending: <strong>{formatCurrency(semTotal - semPaid)}</strong></span>
                  </div>
                  <div style={{ background: '#f3f4f6', borderRadius: 999, height: 8, marginBottom: 10 }}>
                    <div style={{ width: `${pct}%`, height: '100%', borderRadius: 999, background: pct === 100 ? '#22c55e' : '#f59e0b' }} />
                  </div>
                  <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
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
        )}

        {/* Notifications Tab */}
        {tab === 'notifications' && (
          notifications.length === 0 ? (
            <div className="empty-state">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9 M13.73 21a2 2 0 01-3.46 0" /></svg>
              <p>No notifications yet</p>
            </div>
          ) : (
            <div className="table-wrap">
              <table>
                <thead>
                  <tr><th>Title</th><th>Type</th><th>Message</th><th>Date</th><th>Status</th></tr>
                </thead>
                <tbody>
                  {notifications.map(n => (
                    <tr key={n.id} style={{ background: n.is_read ? 'transparent' : '#fffbeb' }}>
                      <td style={{ fontWeight: n.is_read ? 400 : 700 }}>{n.title}</td>
                      <td><span className={`badge ${TYPE_BADGE[n.notification_type]}`}>{TYPE_LABEL[n.notification_type]}</span></td>
                      <td style={{ maxWidth: 260, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', color: 'var(--text-muted)', fontSize: 13 }}>{n.message}</td>
                      <td style={{ fontSize: 12, color: 'var(--text-muted)' }}>{new Date(n.created_at).toLocaleDateString('en-IN')}</td>
                      <td>
                        <span className={`badge ${n.is_read ? 'badge-success' : 'badge-warning'}`}>
                          {n.is_read ? 'Read' : 'Unread'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )
        )}
      </div>
    </div>
  )
}
