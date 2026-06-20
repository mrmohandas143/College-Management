import { useState, useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { getSalaries, getEmployees, createSalary, updateSalary } from '../../services/hrService'

const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December']
const YEAR = new Date().getFullYear()

export default function SalaryList() {
  const [salaries, setSalaries] = useState([])
  const [employees, setEmployees] = useState([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ employee: '', month: 'January', year: YEAR, basic_salary: '', allowances: 0, deductions: 0, status: 'pending', paid_on: '' })
  const [editId, setEditId] = useState(null)
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()

  const load = async () => {
    setLoading(true)
    try {
      const empFilter = searchParams.get('employee')
      const [sRes, eRes] = await Promise.all([getSalaries(empFilter), getEmployees()])
      setSalaries(sRes.data.results ?? sRes.data)
      setEmployees(eRes.data.results ?? eRes.data)
    } finally { setLoading(false) }
  }

  useEffect(() => { load() }, [])

  const set = e => setForm(f => ({ ...f, [e.target.name]: e.target.value }))

  const handleSubmit = async (e) => {
    e.preventDefault()
    editId ? await updateSalary(editId, form) : await createSalary(form)
    setShowForm(false)
    setEditId(null)
    setForm({ employee: '', month: 'January', year: YEAR, basic_salary: '', allowances: 0, deductions: 0, status: 'pending', paid_on: '' })
    load()
  }

  const openEdit = (s) => {
    setForm({ employee: s.employee, month: s.month, year: s.year, basic_salary: s.basic_salary, allowances: s.allowances, deductions: s.deductions, status: s.status, paid_on: s.paid_on || '' })
    setEditId(s.id)
    setShowForm(true)
  }

  const statusBadge = (s) => <span className={`badge badge-${s === 'paid' ? 'success' : 'warning'}`}>{s}</span>

  return (
    <div className="page-container">
      <div className="page-header">
        <div>
          <h1 className="page-title">Salary</h1>
          <p className="page-subtitle">Manage payroll records</p>
        </div>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <button className="btn btn-outline" onClick={() => navigate('/hr/employees')}>← Employees</button>
          <button className="btn btn-primary" onClick={() => { setShowForm(true); setEditId(null) }}>+ Add Salary</button>
        </div>
      </div>

      {showForm && (
        <div className="card" style={{ marginBottom: '1rem' }}>
          <div className="card-body">
            <h3 style={{ marginBottom: '1rem' }}>{editId ? 'Edit' : 'Add'} Salary Record</h3>
            <form onSubmit={handleSubmit}>
              <div className="form-grid">
                <div className="form-group">
                  <label className="form-label">Employee</label>
                  <select className="form-control" name="employee" value={form.employee} onChange={set} required>
                    <option value="">Select employee</option>
                    {employees.map(e => <option key={e.id} value={e.id}>{e.first_name} {e.last_name}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Month</label>
                  <select className="form-control" name="month" value={form.month} onChange={set}>
                    {MONTHS.map(m => <option key={m} value={m}>{m}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Year</label>
                  <input className="form-control" type="number" name="year" value={form.year} onChange={set} />
                </div>
                <div className="form-group">
                  <label className="form-label">Basic Salary</label>
                  <input className="form-control" type="number" name="basic_salary" value={form.basic_salary} onChange={set} required />
                </div>
                <div className="form-group">
                  <label className="form-label">Allowances</label>
                  <input className="form-control" type="number" name="allowances" value={form.allowances} onChange={set} />
                </div>
                <div className="form-group">
                  <label className="form-label">Deductions</label>
                  <input className="form-control" type="number" name="deductions" value={form.deductions} onChange={set} />
                </div>
                <div className="form-group">
                  <label className="form-label">Status</label>
                  <select className="form-control" name="status" value={form.status} onChange={set}>
                    <option value="pending">Pending</option>
                    <option value="paid">Paid</option>
                  </select>
                </div>
                {form.status === 'paid' && (
                  <div className="form-group">
                    <label className="form-label">Paid On</label>
                    <input className="form-control" type="date" name="paid_on" value={form.paid_on} onChange={set} />
                  </div>
                )}
              </div>
              <div style={{ display: 'flex', gap: '0.5rem', marginTop: '1rem' }}>
                <button className="btn btn-primary" type="submit">Save</button>
                <button className="btn btn-outline" type="button" onClick={() => setShowForm(false)}>Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className="card">
        <div className="card-body">
          {loading ? <div className="loader" /> : (
            <div className="table-responsive">
              <table className="table">
                <thead>
                  <tr><th>Employee</th><th>Month</th><th>Year</th><th>Basic</th><th>Allowances</th><th>Deductions</th><th>Net</th><th>Status</th><th>Actions</th></tr>
                </thead>
                <tbody>
                  {salaries.length === 0 ? (
                    <tr><td colSpan={9} style={{ textAlign: 'center' }}>No salary records</td></tr>
                  ) : salaries.map(s => (
                    <tr key={s.id}>
                      <td>{s.employee_name}</td>
                      <td>{s.month}</td>
                      <td>{s.year}</td>
                      <td>₹{Number(s.basic_salary).toLocaleString()}</td>
                      <td>₹{Number(s.allowances).toLocaleString()}</td>
                      <td>₹{Number(s.deductions).toLocaleString()}</td>
                      <td><strong>₹{Number(s.net_salary).toLocaleString()}</strong></td>
                      <td>{statusBadge(s.status)}</td>
                      <td><button className="btn btn-sm btn-outline" onClick={() => openEdit(s)}>Edit</button></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
