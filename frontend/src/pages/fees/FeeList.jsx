import { useEffect, useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { getFees, deleteFee, updateFee, patchFee } from '../../services/feeService'
import Loader from '../../components/Loader'
import useAuth from '../../hooks/useAuth'
import { formatDate, formatCurrency, statusBadge } from '../../utils/helpers'
import { jsPDF } from 'jspdf'
import autoTable from 'jspdf-autotable'

function downloadReceipt(fee) {
  const doc = new jsPDF({ unit: 'mm', format: 'a5' })
  const pageW = doc.internal.pageSize.getWidth()

  doc.setFillColor(37, 99, 235)
  doc.rect(0, 0, pageW, 28, 'F')
  doc.setTextColor(255, 255, 255)
  doc.setFontSize(16)
  doc.setFont('helvetica', 'bold')
  doc.text('CollegeMS', pageW / 2, 11, { align: 'center' })
  doc.setFontSize(9)
  doc.setFont('helvetica', 'normal')
  doc.text('Fee Payment Receipt', pageW / 2, 18, { align: 'center' })
  doc.text('College Management System', pageW / 2, 24, { align: 'center' })

  doc.setTextColor(30, 30, 30)
  doc.setFontSize(8)
  doc.setFont('helvetica', 'bold')
  doc.text(`Receipt No: ${fee.receipt_number || `RCP-${fee.id}`}`, 10, 36)
  doc.text(`Date: ${formatDate(fee.paid_date || new Date().toISOString())}`, pageW - 10, 36, { align: 'right' })

  doc.setDrawColor(220, 220, 220)
  doc.line(10, 39, pageW - 10, 39)

  doc.setFont('helvetica', 'bold')
  doc.setFontSize(9)
  doc.text('Student Details', 10, 46)
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(8.5)
  doc.text('Name:', 10, 53)
  doc.setFont('helvetica', 'bold')
  doc.text(fee.student_name || '-', 35, 53)
  doc.setFont('helvetica', 'normal')
  doc.text('Roll No:', 10, 59)
  doc.text(fee.student_roll || '-', 35, 59)
  doc.text('Course:', 10, 65)
  doc.text(fee.student_course || '-', 35, 65)

  doc.setFont('helvetica', 'bold')
  doc.setFontSize(9)
  doc.text('Fee Details', 10, 74)

  autoTable(doc, {
    startY: 77,
    margin: { left: 10, right: 10 },
    head: [['Description', 'Amount']],
    body: [
      [fee.fee_type, formatCurrency(fee.amount)],
      ...(Number(fee.discount_amount) > 0 ? [['Discount', `- ${formatCurrency(fee.discount_amount)}`]] : []),
      ...(Number(fee.fine_amount) > 0 ? [['Fine / Penalty', `+ ${formatCurrency(fee.fine_amount)}`]] : []),
    ],
    foot: [['Net Payable', formatCurrency(fee.net_amount || fee.amount)]],
    headStyles: { fillColor: [37, 99, 235], fontSize: 8, fontStyle: 'bold' },
    footStyles: { fillColor: [240, 245, 255], textColor: [37, 99, 235], fontStyle: 'bold', fontSize: 9 },
    bodyStyles: { fontSize: 8 },
    alternateRowStyles: { fillColor: [248, 250, 252] },
  })

  const afterTable = doc.lastAutoTable.finalY + 8

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(8)
  doc.text(`Payment Mode: ${fee.payment_mode || 'Cash'}`, 10, afterTable)
  doc.text(`Semester: ${fee.semester ? `Sem ${fee.semester}` : '-'}`, pageW - 10, afterTable, { align: 'right' })
  doc.text(`Academic Year: ${fee.academic_year || '-'}`, 10, afterTable + 6)

  const statusColor = fee.status === 'paid' ? [34, 197, 94] : fee.status === 'overdue' ? [239, 68, 68] : [245, 158, 11]
  doc.setFillColor(...statusColor)
  doc.roundedRect(pageW / 2 - 18, afterTable + 10, 36, 9, 2, 2, 'F')
  doc.setTextColor(255, 255, 255)
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(8)
  doc.text(fee.status.toUpperCase(), pageW / 2, afterTable + 16, { align: 'center' })

  doc.setTextColor(150, 150, 150)
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(7)
  const pageH = doc.internal.pageSize.getHeight()
  doc.text('This is a computer-generated receipt. No signature required.', pageW / 2, pageH - 8, { align: 'center' })
  doc.line(10, pageH - 12, pageW - 10, pageH - 12)

  doc.save(`Receipt_${fee.student_name?.replace(/\s+/g, '_')}_${fee.fee_type?.replace(/\s+/g, '_')}.pdf`)
}

function ActionMenu({ items }) {
  const [open, setOpen] = useState(false)
  return (
    <div style={{ position: 'relative', display: 'inline-block' }}>
      <button onClick={() => setOpen(o => !o)} className="btn btn-outline btn-sm" style={{ padding: '4px 10px', fontSize: 18, lineHeight: 1 }}>⋮</button>
      {open && (
        <>
          <div onClick={() => setOpen(false)} style={{ position: 'fixed', inset: 0, zIndex: 10 }} />
          <div style={{ position: 'absolute', right: 0, top: '110%', zIndex: 20, background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 8, boxShadow: '0 4px 16px rgba(0,0,0,0.12)', minWidth: 150, overflow: 'hidden' }}>
            {items.map((item, i) => (
              <button key={i} onClick={() => { setOpen(false); item.onClick() }}
                style={{ display: 'flex', alignItems: 'center', gap: 8, width: '100%', padding: '9px 14px', background: 'none', border: 'none', cursor: 'pointer', fontSize: 13, color: item.danger ? 'var(--danger)' : item.color || 'var(--text)' }}>
                {item.label}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  )
}

export default function FeeList() {
  const [fees, setFees] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState('')
  const navigate = useNavigate()
  const location = useLocation()
  const { user } = useAuth()
  const isAdmin = user?.role === 'admin'
  const studentId = new URLSearchParams(location.search).get('student')

  const load = (q = '') => {
    setLoading(true)
    getFees({ search: q }).then(r => setFees(r.data)).finally(() => setLoading(false))
  }

  useEffect(() => {
    const delay = search ? 400 : 0
    const timer = setTimeout(() => load(search), delay)
    return () => clearTimeout(timer)
  }, [search])

  const handleDelete = async (id) => {
    if (!confirm('Delete this fee record?')) return
    await deleteFee(id)
    load(search)
  }

  const handleMarkPaid = async (fee) => {
    await patchFee(fee.id, { status: 'paid', paid_date: new Date().toISOString().split('T')[0] })
    load(search)
  }

  const handlePayNow = async (fee) => {
    const mode = prompt('Enter payment mode (Cash/UPI/Card/Online):', 'UPI')
    if (!mode) return
    const txn = prompt('Enter transaction ID (optional):', '') ?? ''
    try {
      await patchFee(fee.id, {
        status: 'paid',
        payment_mode: mode,
        transaction_id: txn,
        paid_date: new Date().toISOString().split('T')[0],
      })
      load(search)
    } catch {
      alert('Payment failed. Please try again.')
    }
  }

  const filtered = fees
    .filter(f => !studentId || f.student === Number(studentId))
    .filter(f => !filter || f.status === filter)

  return (
    <div>
      <div className="page-header">
        <div>
          <h1>Fees</h1>
          <p>
            {studentId
              ? `${filtered.length} records for this student`
              : `${filtered.length} of ${fees.length} records`}
          </p>
        </div>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {studentId && (
            <button onClick={() => navigate(`/students/${studentId}`)} className="btn btn-outline">
              Back to Student
            </button>
          )}
          {!studentId && user?.role === 'student' && (
            <button onClick={() => navigate(`/students/${user.student_id}`)} className="btn btn-outline">
              Back to Profile
            </button>
          )}
          {isAdmin && <Link to="/fees/structure" className="btn btn-outline">Fee Structure</Link>}
        </div>
      </div>

      <div className="card">
        <div className="toolbar">
          <div className="search-bar">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8" /><path d="M21 21l-4.35-4.35" /></svg>
            <input placeholder="Search fees..." value={search} onChange={e => setSearch(e.target.value)} />
          </div>
          <div style={{ display: 'flex', gap: 6 }}>
            {['', 'paid', 'pending', 'overdue'].map(s => (
              <button key={s} onClick={() => setFilter(s)} className={`btn btn-sm ${filter === s ? 'btn-primary' : 'btn-outline'}`}>
                {s || 'All'}
              </button>
            ))}
          </div>
        </div>

        {loading ? <Loader /> : filtered.length === 0 ? (
          <div className="empty-state">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M12 1v22M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6" /></svg>
            <p>No fee records found</p>
          </div>
        ) : (
          <div className="table-wrap">
            <table>
              <thead>
                <tr><th>Student</th><th>Fee Type</th><th>Amount</th><th>Due Date</th><th>Paid Date</th><th>Status</th><th>Actions</th></tr>
              </thead>
              <tbody>
                {filtered.map(f => (
                  <tr key={f.id}>
                    <td>
                      <div style={{ fontWeight: 500 }}>{f.student_name}</div>
                      <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{f.student_roll}</div>
                    </td>
                    <td>{f.fee_type}</td>
                    <td>
                      <div style={{ fontWeight: 600 }}>{formatCurrency(f.net_amount || f.amount)}</div>
                      {Number(f.discount_amount) > 0 && (
                        <div style={{ fontSize: 11, color: 'var(--success)' }}>-{formatCurrency(f.discount_amount)} disc.</div>
                      )}
                    </td>
                    <td>{formatDate(f.due_date)}</td>
                    <td>{formatDate(f.paid_date)}</td>
                    <td><span className={`badge ${statusBadge(f.status)}`}>{f.status}</span></td>
                    <td>
                      <ActionMenu items={[
                        ...(isAdmin && f.status !== 'paid' ? [{ label: 'Mark Paid', color: 'var(--success)', onClick: () => handleMarkPaid(f) }] : []),
                        ...(f.status === 'paid' ? [{ label: 'Receipt', color: 'var(--primary)', onClick: () => downloadReceipt(f) }] : []),
                        ...(isAdmin ? [{ label: 'Edit', onClick: () => navigate(`/fees/${f.id}/edit`) }] : []),
                        ...(isAdmin ? [{ label: 'Delete', danger: true, onClick: () => handleDelete(f.id) }] : []),
                        ...(!isAdmin && f.status !== 'paid' ? [{ label: 'Pay Now', color: 'var(--primary)', onClick: () => handlePayNow(f) }] : []),
                      ]} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
