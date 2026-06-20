import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { getEmployeeById, getPayrollConfig, savePayrollConfig } from '../../services/hrService'

export default function EmployeeProfile() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [emp, setEmp] = useState(null)
  const [cfg, setCfg] = useState(null)
  const [cfgForm, setCfgForm] = useState({ employee: id, hra_percent: 20, ta_percent: 10, pf_percent: 12, tax_percent: 10, other_allowances: 0, other_deductions: 0 })
  const [showCfg, setShowCfg] = useState(false)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    getEmployeeById(id).then(r => setEmp(r.data))
    getPayrollConfig(id).then(r => {
      const list = r.data.results ?? r.data
      if (list.length) { setCfg(list[0]); setCfgForm(list[0]) }
    })
  }, [id])

  const saveCfg = async (e) => {
    e.preventDefault()
    setSaving(true)
    const res = await savePayrollConfig({ ...cfgForm, employee: id })
    setCfg(res.data)
    setSaving(false)
    setShowCfg(false)
  }

  if (!emp) return <div className="loader" />

  const statusColor = { active: 'success', inactive: 'warning', terminated: 'danger' }
  const row = (label, value) => (
    <div className="detail-row" key={label}>
      <span className="detail-label">{label}</span>
      <span className="detail-value">{value || '—'}</span>
    </div>
  )

  return (
    <div className="page-container">
      <div className="page-header">
        <div>
          <h1 className="page-title">{emp.first_name} {emp.last_name}</h1>
          <p className="page-subtitle">{emp.designation} · {emp.department_name}</p>
        </div>
        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
          <button className="btn btn-outline" onClick={() => navigate(`/hr/employees/${id}/edit`)}>Edit</button>
          <button className="btn btn-outline" onClick={() => navigate(`/hr/attendance?employee=${id}`)}>Attendance</button>
          <button className="btn btn-outline" onClick={() => navigate(`/hr/leaves?employee=${id}`)}>Leaves</button>
          <button className="btn btn-outline" onClick={() => navigate(`/hr/payroll?employee=${id}`)}>Payroll</button>
          <button className="btn btn-outline" onClick={() => navigate('/hr/employees')}>← Back</button>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
        <div className="card">
          <div className="card-body">
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.25rem' }}>
              <div style={{ width: 56, height: 56, borderRadius: '50%', background: 'var(--primary)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.4rem', fontWeight: 700 }}>
                {emp.first_name[0]}{emp.last_name[0]}
              </div>
              <div>
                <div style={{ fontWeight: 600 }}>{emp.first_name} {emp.last_name}</div>
                <span className={`badge badge-${statusColor[emp.status]}`}>{emp.status}</span>
              </div>
            </div>
            {row('Employee ID', emp.employee_id)}
            {row('Email', emp.email)}
            {row('Phone', emp.phone)}
            {row('Gender', emp.gender)}
            {row('Date of Birth', emp.date_of_birth)}
            {row('Address', emp.address)}
          </div>
        </div>

        <div className="card">
          <div className="card-body">
            <p style={{ fontWeight: 600, marginBottom: '0.75rem' }}>Employment</p>
            {row('Department', emp.department_name)}
            {row('Designation', emp.designation)}
            {row('Type', emp.employment_type?.replace('_', ' '))}
            {row('Date of Joining', emp.date_of_joining)}
            {row('Basic Salary', `₹${Number(emp.basic_salary).toLocaleString()}`)}
          </div>
        </div>
      </div>

      <div className="card" style={{ marginTop: '1rem' }}>
        <div className="card-body">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
            <p style={{ fontWeight: 600, margin: 0 }}>Payroll Configuration</p>
            <button className="btn btn-sm btn-outline" onClick={() => setShowCfg(s => !s)}>{showCfg ? 'Cancel' : cfg ? 'Edit Config' : 'Set Config'}</button>
          </div>
          {!showCfg && cfg && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: '0.5rem' }}>
              {[['HRA', cfg.hra_percent + '%'], ['TA', cfg.ta_percent + '%'], ['PF', cfg.pf_percent + '%'], ['Tax', cfg.tax_percent + '%'], ['Other Allow', '₹' + cfg.other_allowances], ['Other Deduct', '₹' + cfg.other_deductions]].map(([l, v]) => (
                <div key={l} style={{ background: 'var(--bg)', borderRadius: 8, padding: '0.5rem 0.75rem' }}>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{l}</div>
                  <div style={{ fontWeight: 600 }}>{v}</div>
                </div>
              ))}
            </div>
          )}
          {!showCfg && !cfg && <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>No payroll config set. Default rates will be used.</p>}
          {showCfg && (
            <form onSubmit={saveCfg}>
              <div className="form-grid">
                {[['HRA %', 'hra_percent'], ['TA %', 'ta_percent'], ['PF %', 'pf_percent'], ['Tax %', 'tax_percent'], ['Other Allowances', 'other_allowances'], ['Other Deductions', 'other_deductions']].map(([label, name]) => (
                  <div className="form-group" key={name}>
                    <label className="form-label">{label}</label>
                    <input className="form-control" type="number" step="0.01" name={name} value={cfgForm[name]} onChange={e => setCfgForm(f => ({ ...f, [e.target.name]: e.target.value }))} />
                  </div>
                ))}
              </div>
              <button className="btn btn-primary" type="submit" disabled={saving} style={{ marginTop: '0.75rem' }}>{saving ? 'Saving...' : 'Save Config'}</button>
            </form>
          )}
        </div>
      </div>
    </div>
  )
}
