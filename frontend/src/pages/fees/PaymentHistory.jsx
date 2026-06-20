import { useEffect, useState } from 'react'
import { getFees } from '../../services/feeService'
import Loader from '../../components/Loader'
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
  doc.text(fee.student_name || '—', 35, 53)
  doc.setFont('helvetica', 'normal')
  doc.text('Roll No:', 10, 59)
  doc.text(fee.student_roll || '—', 35, 59)
  doc.text('Course:', 10, 65)
  doc.text(fee.student_course || '—', 35, 65)

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
  doc.text(`Academic Year: ${fee.academic_year || '—'}`, 10, afterTable + 6)

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

function downloadAllPDF(fees) {
  if (!fees.length) return
  const doc = new jsPDF({ unit: 'mm', format: 'a4' })
  const pageW = doc.internal.pageSize.getWidth()

  doc.setFillColor(37, 99, 235)
  doc.rect(0, 0, pageW, 22, 'F')
  doc.setTextColor(255, 255, 255)
  doc.setFontSize(14)
  doc.setFont('helvetica', 'bold')
  doc.text('CollegeMS — Payment History Report', pageW / 2, 10, { align: 'center' })
  doc.setFontSize(8)
  doc.setFont('helvetica', 'normal')
  doc.text(`Generated: ${new Date().toLocaleDateString('en-IN')}   Total Records: ${fees.length}`, pageW / 2, 17, { align: 'center' })

  autoTable(doc, {
    startY: 28,
    head: [['#', 'Student', 'Roll No', 'Fee Type', 'Amount', 'Due Date', 'Paid Date', 'Status']],
    body: fees.map((f, i) => [
      i + 1,
      f.student_name,
      f.student_roll || '—',
      f.fee_type,
      formatCurrency(f.net_amount || f.amount),
      formatDate(f.due_date),
      formatDate(f.paid_date),
      f.status.toUpperCase(),
    ]),
    headStyles: { fillColor: [37, 99, 235], fontSize: 8, fontStyle: 'bold' },
    bodyStyles: { fontSize: 8 },
    alternateRowStyles: { fillColor: [248, 250, 252] },
    columnStyles: { 7: { fontStyle: 'bold' } },
    didDrawCell: (data) => {
      if (data.section === 'body' && data.column.index === 7) {
        const val = data.cell.raw
        if (val === 'PAID') data.cell.styles.textColor = [21, 128, 61]
        else if (val === 'OVERDUE') data.cell.styles.textColor = [185, 28, 28]
        else data.cell.styles.textColor = [180, 83, 9]
      }
    },
  })

  doc.save(`Payment_History_${new Date().toISOString().split('T')[0]}.pdf`)
}

export default function PaymentHistory() {
  const [fees, setFees] = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('')
  const [search, setSearch] = useState('')

  useEffect(() => {
    getFees().then(r => setFees(r.data)).finally(() => setLoading(false))
  }, [])

  const paid = fees.filter(f => f.status === 'paid')
  const pending = fees.filter(f => f.status === 'pending')
  const overdue = fees.filter(f => f.status === 'overdue')
  const totalRevenue = paid.reduce((s, f) => s + Number(f.net_amount || f.amount), 0)

  const filtered = fees.filter(f => {
    const matchStatus = !filter || f.status === filter
    const matchSearch = !search ||
      f.student_name?.toLowerCase().includes(search.toLowerCase()) ||
      f.fee_type?.toLowerCase().includes(search.toLowerCase()) ||
      f.student_roll?.toLowerCase().includes(search.toLowerCase())
    return matchStatus && matchSearch
  })

  return (
    <div>
      <div className="page-header">
        <div><h1>Payment History</h1><p>All fee transactions</p></div>
        <button onClick={() => downloadAllPDF(filtered)} className="btn btn-outline" style={{ color: 'var(--primary)' }}>
          ⬇ Export PDF
        </button>
      </div>

      <div className="stats-grid" style={{ marginBottom: 20 }}>
        {[
          { label: 'Total Collected', value: formatCurrency(totalRevenue), color: '#22c55e', bg: '#dcfce7' },
          { label: 'Paid Records', value: paid.length, color: '#15803d', bg: '#dcfce7' },
          { label: 'Pending', value: pending.length, color: '#b45309', bg: '#fef3c7' },
          { label: 'Overdue', value: overdue.length, color: '#b91c1c', bg: '#fee2e2' },
        ].map(item => (
          <div key={item.label} className="stat-card" style={{ borderLeft: `4px solid ${item.color}` }}>
            <div className="stat-value" style={{ color: item.color }}>{item.value}</div>
            <div className="stat-label">{item.label}</div>
          </div>
        ))}
      </div>

      <div className="card">
        <div className="toolbar">
          <div className="search-bar">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8" /><path d="M21 21l-4.35-4.35" /></svg>
            <input placeholder="Search by name, roll, fee type..." value={search} onChange={e => setSearch(e.target.value)} />
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
          <div className="empty-state"><p>No records found</p></div>
        ) : (
          <div className="table-wrap">
            <table>
              <thead>
                <tr><th>#</th><th>Student</th><th>Fee Type</th><th>Amount</th><th>Due Date</th><th>Paid Date</th><th>Status</th><th>Receipt</th></tr>
              </thead>
              <tbody>
                {filtered.map((f, i) => (
                  <tr key={f.id}>
                    <td style={{ color: 'var(--text-muted)' }}>{i + 1}</td>
                    <td>
                      <div style={{ fontWeight: 500 }}>{f.student_name}</div>
                      <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{f.student_roll}</div>
                    </td>
                    <td>{f.fee_type}</td>
                    <td>
                      <div style={{ fontWeight: 600 }}>{formatCurrency(f.net_amount || f.amount)}</div>
                      {f.description && <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{f.description}</div>}
                    </td>
                    <td>{formatDate(f.due_date)}</td>
                    <td>{formatDate(f.paid_date)}</td>
                    <td><span className={`badge ${statusBadge(f.status)}`}>{f.status}</span></td>
                    <td>
                      {f.status === 'paid' ? (
                        <button onClick={() => downloadReceipt(f)} className="btn btn-outline btn-sm" style={{ color: 'var(--primary)' }}>
                          ⬇ PDF
                        </button>
                      ) : (
                        <span style={{ color: 'var(--text-muted)', fontSize: 12 }}>—</span>
                      )}
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
