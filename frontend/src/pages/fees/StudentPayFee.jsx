import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../../api/axios'
import Loader from '../../components/Loader'
import useAuth from '../../hooks/useAuth'
import { formatCurrency } from '../../utils/helpers'
import { jsPDF } from 'jspdf'
import autoTable from 'jspdf-autotable'

const COURSE_FEES = {
  'B.Tech': { tuition: 50000, exam: 2000, library: 1500, transport: 8000, lab: 5000, hostel: 40000, sports: 2000 },
  'M.Tech': { tuition: 60000, exam: 2500, library: 2000, transport: 8000, lab: 6000, hostel: 42000, sports: 2000 },
  'BCA':    { tuition: 40000, exam: 1500, library: 1000, transport: 7000, lab: 3000, hostel: 35000, sports: 1500 },
  'MCA':    { tuition: 45000, exam: 2000, library: 1500, transport: 7000, lab: 4000, hostel: 38000, sports: 1500 },
  'B.Sc':   { tuition: 35000, exam: 1500, library: 1000, transport: 6000, lab: 3000, hostel: 32000, sports: 1500 },
  'M.Sc':   { tuition: 40000, exam: 2000, library: 1500, transport: 6000, lab: 4000, hostel: 35000, sports: 1500 },
  'B.Com':  { tuition: 30000, exam: 1500, library: 1000, transport: 6000, lab: 1000, hostel: 30000, sports: 1500 },
  'M.Com':  { tuition: 35000, exam: 2000, library: 1500, transport: 6000, lab: 1000, hostel: 32000, sports: 1500 },
  'BBA':    { tuition: 45000, exam: 2000, library: 1500, transport: 7000, lab: 1000, hostel: 38000, sports: 2000 },
  'MBA':    { tuition: 70000, exam: 3000, library: 2500, transport: 9000, lab: 2000, hostel: 50000, sports: 2500 },
}

const FEE_TYPES = [
  { key: 'tuition',   label: 'Tuition Fee',   color: '#2563eb', bg: '#eff6ff' },
  { key: 'exam',      label: 'Exam Fee',       color: '#7c3aed', bg: '#f5f3ff' },
  { key: 'library',   label: 'Library Fee',    color: '#059669', bg: '#ecfdf5' },
  { key: 'transport', label: 'Transport Fee',  color: '#d97706', bg: '#fffbeb' },
  { key: 'lab',       label: 'Lab Fee',        color: '#0891b2', bg: '#ecfeff' },
  { key: 'hostel',    label: 'Hostel Fee',     color: '#dc2626', bg: '#fef2f2' },
  { key: 'sports',    label: 'Sports Fee',     color: '#16a34a', bg: '#f0fdf4' },
]

function downloadReceipt(student, feeType, amount, paymentMode, txnId) {
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
  doc.text(`Receipt No: RCP-${Date.now()}`, 10, 36)
  doc.text(`Date: ${new Date().toLocaleDateString('en-IN')}`, pageW - 10, 36, { align: 'right' })
  doc.setDrawColor(220, 220, 220)
  doc.line(10, 39, pageW - 10, 39)

  doc.setFont('helvetica', 'bold')
  doc.setFontSize(9)
  doc.text('Student Details', 10, 46)
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(8.5)
  doc.text('Name:', 10, 53)
  doc.setFont('helvetica', 'bold')
  doc.text(`${student.first_name} ${student.last_name}`, 35, 53)
  doc.setFont('helvetica', 'normal')
  doc.text('Roll No:', 10, 59)
  doc.text(student.register_number || '-', 35, 59)
  doc.text('Course:', 10, 65)
  doc.text(student.course || '-', 35, 65)

  autoTable(doc, {
    startY: 72,
    margin: { left: 10, right: 10 },
    head: [['Fee Type', 'Amount']],
    body: [[feeType, formatCurrency(amount)]],
    foot: [['Total Paid', formatCurrency(amount)]],
    headStyles: { fillColor: [37, 99, 235], fontSize: 8, fontStyle: 'bold' },
    footStyles: { fillColor: [240, 245, 255], textColor: [37, 99, 235], fontStyle: 'bold', fontSize: 9 },
    bodyStyles: { fontSize: 8 },
  })

  const y = doc.lastAutoTable.finalY + 8
  doc.setFontSize(8)
  doc.text(`Payment Mode: ${paymentMode}`, 10, y)
  doc.text(`Transaction ID: ${txnId}`, 10, y + 6)

  doc.setFillColor(34, 197, 94)
  doc.roundedRect(pageW / 2 - 18, y + 12, 36, 9, 2, 2, 'F')
  doc.setTextColor(255, 255, 255)
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(8)
  doc.text('PAID', pageW / 2, y + 18, { align: 'center' })

  doc.setTextColor(150, 150, 150)
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(7)
  const pageH = doc.internal.pageSize.getHeight()
  doc.text('This is a computer-generated receipt. No signature required.', pageW / 2, pageH - 8, { align: 'center' })
  doc.line(10, pageH - 12, pageW - 10, pageH - 12)

  doc.save(`Receipt_${student.register_number}_${feeType.replace(/\s/g, '_')}.pdf`)
}

export default function StudentPayFee() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [student, setStudent] = useState(null)
  const [paidFees, setPaidFees] = useState([])
  const [loading, setLoading] = useState(true)
  const [selected, setSelected] = useState(null)
  const [paymentMode, setPaymentMode] = useState('Online')
  const [txnId, setTxnId] = useState('')
  const [paying, setPaying] = useState(false)
  const [success, setSuccess] = useState(null)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!user?.student_id) { setLoading(false); return }
    api.get(`/students/${user.student_id}/`)
      .then(r => {
        setStudent(r.data)
        api.get('/fees/')
          .then(fr => setPaidFees(fr.data.filter(f => f.student === user.student_id && f.status === 'paid')))
          .catch(() => {})
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [user])

  const baseCourse = student?.course?.split(' - ')[0] || student?.course || ''
  const courseFees = COURSE_FEES[baseCourse] || COURSE_FEES['B.Sc']

  const isPaid = (key) => paidFees.some(f =>
    f.fee_type?.toLowerCase().includes(key) || key.includes(f.fee_type?.toLowerCase())
  )

  const handlePay = async () => {
    if (!selected) return
    if (!txnId.trim()) { setError('Please enter Transaction ID'); return }
    setPaying(true)
    setError('')
    try {
      const today = new Date().toISOString().split('T')[0]
      const due = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
      await api.post('/fees/', {
        student: user.student_id,
        fee_type: selected.label,
        amount: selected.amount,
        discount_amount: 0,
        fine_amount: 0,
        due_date: due,
        paid_date: today,
        status: 'paid',
        payment_mode: paymentMode,
        transaction_id: txnId,
        academic_year: '2024-25',
        description: `${selected.label} paid by student - ${student.course}`,
      })
      setSuccess({ feeType: selected.label, amount: selected.amount })
      setPaidFees(prev => [...prev, { fee_type: selected.label, status: 'paid' }])
      setSelected(null)
      setTxnId('')
    } catch (err) {
      setError(err.response?.data ? Object.values(err.response.data).flat().join(' ') : 'Payment failed. Try again.')
    } finally {
      setPaying(false)
    }
  }

  if (loading) return <Loader />
  if (!student) return (
    <div className="empty-state" style={{ paddingTop: 80 }}>
      <p>No student record linked. Contact admin.</p>
    </div>
  )

  return (
    <div>
      <div className="page-header">
        <div>
          <h1>Fee Details & Payment</h1>
          <p>{student.course} · {student.register_number}</p>
        </div>
        <button onClick={() => navigate('/my-profile')} className="btn btn-outline">← Back</button>
      </div>

      {success && (
        <div style={{ background: '#dcfce7', border: '1px solid #bbf7d0', borderRadius: 10, padding: '16px 20px', marginBottom: 20, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <div style={{ fontWeight: 700, color: '#15803d' }}>Payment Successful!</div>
            <div style={{ fontSize: 13, color: '#166534', marginTop: 2 }}>{success.feeType} — {formatCurrency(success.amount)}</div>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button onClick={() => downloadReceipt(student, success.feeType, success.amount, paymentMode, txnId || 'N/A')} className="btn btn-primary">
              Download Receipt
            </button>
            <button onClick={() => setSuccess(null)} className="btn btn-outline">Dismiss</button>
          </div>
        </div>
      )}

      <div className="card" style={{ marginBottom: 20 }}>
        <div className="card-header">
          <h3>Fee Structure — {student.course}</h3>
          <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>Click a fee to pay</span>
        </div>
        <div className="card-body">
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(190px, 1fr))', gap: 12 }}>
            {FEE_TYPES.map(ft => {
              const amount = courseFees[ft.key] || 0
              const paid = isPaid(ft.key)
              const isSelected = selected?.key === ft.key
              return (
                <div
                  key={ft.key}
                  onClick={() => !paid && setSelected(isSelected ? null : { ...ft, amount })}
                  style={{
                    border: `2px solid ${paid ? '#bbf7d0' : isSelected ? ft.color : 'var(--border)'}`,
                    background: paid ? '#f0fdf4' : isSelected ? ft.bg : 'var(--white)',
                    borderRadius: 12, padding: '16px',
                    cursor: paid ? 'default' : 'pointer',
                    transition: 'all 0.15s',
                    boxShadow: isSelected ? `0 0 0 3px ${ft.color}25` : 'none',
                  }}
                >
                  <div style={{ fontSize: 12, fontWeight: 700, color: paid ? '#15803d' : ft.color, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{ft.label}</div>
                  <div style={{ fontSize: 22, fontWeight: 800, color: 'var(--text)', margin: '6px 0' }}>{formatCurrency(amount)}</div>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 10 }}>Academic Year 2024-25</div>
                  {paid ? (
                    <div style={{ color: '#15803d', fontWeight: 600, fontSize: 13 }}>Paid</div>
                  ) : (
                    <div style={{
                      padding: '6px 0', textAlign: 'center', fontSize: 13, fontWeight: 600, borderRadius: 6,
                      background: isSelected ? ft.color : 'var(--primary-light)',
                      color: isSelected ? '#fff' : 'var(--primary)',
                    }}>
                      {isSelected ? '✓ Selected' : 'Pay Now'}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      </div>

      {selected && (
        <div className="card">
          <div className="card-header">
            <h3>Confirm Payment</h3>
            <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>
              {selected.label} — <strong>{formatCurrency(selected.amount)}</strong>
            </span>
          </div>
          <div className="card-body">
            {error && <div className="alert alert-error">{error}</div>}
            <div style={{ background: 'var(--bg)', borderRadius: 8, padding: '14px 16px', marginBottom: 20 }}>
              {[
                ['Student', `${student.first_name} ${student.last_name}`],
                ['Roll No', student.register_number],
                ['Course', student.course],
                ['Fee Type', selected.label],
              ].map(([k, v]) => (
                <div key={k} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                  <span style={{ color: 'var(--text-muted)' }}>{k}</span>
                  <span style={{ fontWeight: 600 }}>{v}</span>
                </div>
              ))}
              <div style={{ borderTop: '1px solid var(--border)', paddingTop: 10, marginTop: 4, display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ fontWeight: 700 }}>Total Amount</span>
                <span style={{ fontWeight: 800, fontSize: 18, color: 'var(--primary)' }}>{formatCurrency(selected.amount)}</span>
              </div>
            </div>

            <div className="form-grid">
              <div className="form-group">
                <label className="form-label">Payment Mode *</label>
                <select value={paymentMode} onChange={e => setPaymentMode(e.target.value)}>
                  {['Online', 'UPI', 'Net Banking', 'Card', 'Cash', 'Cheque', 'DD'].map(m => (
                    <option key={m} value={m}>{m}</option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Transaction ID *</label>
                <input
                  value={txnId}
                  onChange={e => setTxnId(e.target.value)}
                  placeholder="Enter transaction / reference ID"
                />
              </div>
            </div>

            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 8 }}>
              <button onClick={() => { setSelected(null); setError('') }} className="btn btn-outline">Cancel</button>
              <button onClick={handlePay} className="btn btn-primary" disabled={paying} style={{ minWidth: 160 }}>
                {paying ? 'Processing...' : `Pay ${formatCurrency(selected.amount)}`}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
