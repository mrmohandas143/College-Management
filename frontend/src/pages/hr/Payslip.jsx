import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { getPayrollById } from '../../services/hrService'

const MONTHS = ['','January','February','March','April','May','June','July','August','September','October','November','December']
const fmt    = (n) => '₹' + Number(n || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })

function toWords(amount) {
  const ones = ['','One','Two','Three','Four','Five','Six','Seven','Eight','Nine',
                 'Ten','Eleven','Twelve','Thirteen','Fourteen','Fifteen','Sixteen',
                 'Seventeen','Eighteen','Nineteen']
  const tens = ['','','Twenty','Thirty','Forty','Fifty','Sixty','Seventy','Eighty','Ninety']

  const convert = (n) => {
    if (n === 0) return ''
    if (n < 20)  return ones[n] + ' '
    if (n < 100) return tens[Math.floor(n / 10)] + ' ' + ones[n % 10] + ' '
    if (n < 1000) return ones[Math.floor(n / 100)] + ' Hundred ' + convert(n % 100)
    if (n < 100000) return convert(Math.floor(n / 1000)) + 'Thousand ' + convert(n % 1000)
    if (n < 10000000) return convert(Math.floor(n / 100000)) + 'Lakh ' + convert(n % 100000)
    return convert(Math.floor(n / 10000000)) + 'Crore ' + convert(n % 10000000)
  }

  const rupees = Math.floor(amount)
  const paise  = Math.round((amount - rupees) * 100)
  let result   = convert(rupees).trim() + ' Rupees'
  if (paise)   result += ' and ' + convert(paise).trim() + ' Paise'
  return result + ' Only'
}

export default function Payslip() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [payroll, setPayroll] = useState(null)

  useEffect(() => { getPayrollById(id).then(r => setPayroll(r.data)) }, [id])

  if (!payroll) return <div className="loader" />

  const perDay = Number(payroll.basic_salary) / payroll.working_days

  const earningsRows = [
    { label: 'Basic Salary',                                    amount: payroll.basic_salary,      note: '' },
    { label: `House Rent Allowance (HRA @ ${payroll.hra_pct}% of Basic)`, amount: payroll.hra,    note: '' },
    { label: `Travel Allowance (TA @ ${payroll.ta_pct}% of Basic)`,       amount: payroll.ta,     note: '' },
    { label: 'Other Allowances',                                amount: payroll.other_allowances,  note: '' },
  ]

  const deductionRows = [
    { label: `Provident Fund (PF @ ${payroll.pf_pct}% of Basic)`,         amount: payroll.pf_deduction,    note: '' },
    { label: `Income Tax (@ ${payroll.tax_pct}% of Gross)`,               amount: payroll.tax_deduction,   note: '' },
    { label: `Absent Deduction (${payroll.absent_days} day(s) × ${fmt(perDay)})`, amount: payroll.absent_deduction, note: '' },
    { label: 'Other Deductions',                                amount: payroll.other_deductions,  note: '' },
  ]

  return (
    <>
      {/* Screen-only controls */}
      <div className="page-container" style={{ maxWidth: 800, margin: '0 auto' }}>
        <div className="page-header no-print">
          <div>
            <h1 className="page-title">Payslip</h1>
            <p className="page-subtitle">{MONTHS[payroll.month]} {payroll.year}</p>
          </div>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button className="btn btn-outline" onClick={() => navigate(-1)}>← Back</button>
            <button className="btn btn-primary" onClick={() => window.print()}>🖨 Print / Save PDF</button>
          </div>
        </div>

        {/* ── Payslip document ── */}
        <div className="card payslip-doc">
          <div className="card-body" style={{ padding: '2rem' }}>

            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '2px solid #1a1a2e', paddingBottom: '1rem', marginBottom: '1.25rem' }}>
              <div>
                <div style={{ fontSize: '1.4rem', fontWeight: 800, letterSpacing: '-0.02em' }}>CollegeMS</div>
                <div style={{ fontSize: '0.8rem', color: '#666' }}>Human Resources Department</div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontWeight: 700, fontSize: '1rem' }}>PAYSLIP</div>
                <div style={{ fontSize: '0.8rem', color: '#666' }}>{MONTHS[payroll.month]} {payroll.year}</div>
                {payroll.status === 'paid' && payroll.paid_on && (
                  <div style={{ fontSize: '0.75rem', color: '#27ae60', fontWeight: 600 }}>Paid on {payroll.paid_on}</div>
                )}
              </div>
            </div>

            {/* Employee details */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.4rem 2rem', marginBottom: '1.5rem', fontSize: '0.875rem' }}>
              {[
                ['Employee Name', payroll.employee_name],
                ['Department',    payroll.department_name || '—'],
                ['Pay Period',    `${MONTHS[payroll.month]} ${payroll.year}`],
                ['Payment Status', payroll.status.toUpperCase()],
              ].map(([l, v]) => (
                <div key={l} style={{ display: 'flex', gap: '0.5rem' }}>
                  <span style={{ color: '#666', minWidth: 130 }}>{l}</span>
                  <span style={{ fontWeight: 600 }}>{v}</span>
                </div>
              ))}
            </div>

            {/* Attendance summary */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5,1fr)', gap: '0.5rem', marginBottom: '1.5rem' }}>
              {[
                ['Working Days', payroll.working_days],
                ['Present',      payroll.present_days],
                ['Half Day',     payroll.half_day],
                ['Leave',        payroll.leave_days],
                ['Absent',       payroll.absent_days],
              ].map(([l, v]) => (
                <div key={l} style={{ background: '#f8f9fa', borderRadius: 6, padding: '0.5rem 0.75rem', textAlign: 'center' }}>
                  <div style={{ fontSize: '0.7rem', color: '#666', marginBottom: '0.15rem' }}>{l}</div>
                  <div style={{ fontWeight: 700, fontSize: '1.1rem' }}>{v}</div>
                </div>
              ))}
            </div>

            {/* Earnings & Deductions side by side */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', marginBottom: '1.25rem' }}>
              {/* Earnings */}
              <div>
                <div style={{ background: '#1a1a2e', color: '#fff', padding: '0.4rem 0.75rem', borderRadius: '4px 4px 0 0', fontWeight: 600, fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                  Earnings
                </div>
                <table style={{ width: '100%', borderCollapse: 'collapse', border: '1px solid #e0e0e0', borderTop: 'none' }}>
                  <thead>
                    <tr style={{ background: '#f5f5f5' }}>
                      <th style={{ padding: '0.4rem 0.75rem', textAlign: 'left', fontSize: '0.75rem', color: '#666', fontWeight: 600 }}>Component</th>
                      <th style={{ padding: '0.4rem 0.75rem', textAlign: 'right', fontSize: '0.75rem', color: '#666', fontWeight: 600 }}>Amount</th>
                    </tr>
                  </thead>
                  <tbody>
                    {earningsRows.map(({ label, amount }) => (
                      <tr key={label} style={{ borderTop: '1px solid #f0f0f0' }}>
                        <td style={{ padding: '0.4rem 0.75rem', fontSize: '0.825rem' }}>{label}</td>
                        <td style={{ padding: '0.4rem 0.75rem', textAlign: 'right', fontSize: '0.825rem' }}>{fmt(amount)}</td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr style={{ borderTop: '2px solid #1a1a2e', background: '#f0f4ff' }}>
                      <td style={{ padding: '0.5rem 0.75rem', fontWeight: 700, fontSize: '0.875rem' }}>Gross Salary</td>
                      <td style={{ padding: '0.5rem 0.75rem', textAlign: 'right', fontWeight: 700, fontSize: '0.875rem', color: '#1a1a2e' }}>{fmt(payroll.gross_salary)}</td>
                    </tr>
                  </tfoot>
                </table>
              </div>

              {/* Deductions */}
              <div>
                <div style={{ background: '#c0392b', color: '#fff', padding: '0.4rem 0.75rem', borderRadius: '4px 4px 0 0', fontWeight: 600, fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                  Deductions
                </div>
                <table style={{ width: '100%', borderCollapse: 'collapse', border: '1px solid #e0e0e0', borderTop: 'none' }}>
                  <thead>
                    <tr style={{ background: '#f5f5f5' }}>
                      <th style={{ padding: '0.4rem 0.75rem', textAlign: 'left', fontSize: '0.75rem', color: '#666', fontWeight: 600 }}>Component</th>
                      <th style={{ padding: '0.4rem 0.75rem', textAlign: 'right', fontSize: '0.75rem', color: '#666', fontWeight: 600 }}>Amount</th>
                    </tr>
                  </thead>
                  <tbody>
                    {deductionRows.map(({ label, amount }) => (
                      <tr key={label} style={{ borderTop: '1px solid #f0f0f0' }}>
                        <td style={{ padding: '0.4rem 0.75rem', fontSize: '0.825rem' }}>{label}</td>
                        <td style={{ padding: '0.4rem 0.75rem', textAlign: 'right', fontSize: '0.825rem', color: '#c0392b' }}>{fmt(amount)}</td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr style={{ borderTop: '2px solid #c0392b', background: '#fff5f5' }}>
                      <td style={{ padding: '0.5rem 0.75rem', fontWeight: 700, fontSize: '0.875rem' }}>Total Deductions</td>
                      <td style={{ padding: '0.5rem 0.75rem', textAlign: 'right', fontWeight: 700, fontSize: '0.875rem', color: '#c0392b' }}>{fmt(payroll.total_deductions)}</td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>

            {/* Net salary formula bar */}
            <div style={{ background: '#1a1a2e', color: '#fff', borderRadius: 8, padding: '1rem 1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <div>
                <div style={{ fontSize: '0.75rem', opacity: 0.7, marginBottom: '0.2rem' }}>
                  Net Salary = Gross Salary − Total Deductions
                </div>
                <div style={{ fontSize: '0.9rem', opacity: 0.85 }}>
                  {fmt(payroll.gross_salary)} − {fmt(payroll.total_deductions)}
                </div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: '0.75rem', opacity: 0.7 }}>NET SALARY</div>
                <div style={{ fontSize: '1.75rem', fontWeight: 800 }}>{fmt(payroll.net_salary)}</div>
              </div>
            </div>

            {/* Amount in words */}
            <div style={{ background: '#f8f9fa', borderRadius: 6, padding: '0.6rem 1rem', fontSize: '0.8rem', color: '#444', marginBottom: '1.5rem' }}>
              <span style={{ fontWeight: 600 }}>Amount in Words: </span>
              {toWords(Number(payroll.net_salary))}
            </div>

            {/* Signature row */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem', marginTop: '2rem', paddingTop: '1rem', borderTop: '1px solid #e0e0e0' }}>
              {['Prepared By', 'Verified By', 'Employee Signature'].map(label => (
                <div key={label} style={{ textAlign: 'center' }}>
                  <div style={{ borderTop: '1px solid #999', paddingTop: '0.4rem', fontSize: '0.75rem', color: '#666' }}>{label}</div>
                </div>
              ))}
            </div>

            <p style={{ textAlign: 'center', fontSize: '0.7rem', color: '#aaa', marginTop: '1rem' }}>
              This is a computer-generated payslip and does not require a physical signature.
            </p>
          </div>
        </div>
      </div>

      <style>{`
        @media print {
          .no-print { display: none !important; }
          .page-container { max-width: 100% !important; padding: 0 !important; }
          .card { box-shadow: none !important; border: none !important; }
          body { background: #fff !important; }
        }
      `}</style>
    </>
  )
}
