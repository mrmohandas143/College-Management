import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { createEmployee, getEmployeeById, updateEmployee } from '../../services/hrService'
import { getDepartments } from '../../services/departmentService'

const INIT = {
  employee_id: '', first_name: '', last_name: '', email: '', phone: '',
  gender: '', date_of_birth: '', address: '', department: '',
  designation: '', employment_type: 'full_time', date_of_joining: '',
  basic_salary: '', status: 'active',
}

function genEmpId() {
  return 'EMP' + Date.now().toString().slice(-5)
}

const Field = ({ label, name, type = 'text', required, placeholder, form, set, errors }) => (
  <div className="form-group">
    <label className="form-label">{label}{required && <span style={{ color: 'var(--danger)', marginLeft: 2 }}>*</span>}</label>
    <input
      className={`form-control${errors[name] ? ' is-invalid' : ''}`}
      type={type} name={name} value={form[name] ?? ''}
      onChange={set} placeholder={placeholder}
    />
    {errors[name] && <div style={{ color: 'var(--danger)', fontSize: 12, marginTop: 3 }}>{errors[name]}</div>}
  </div>
)

const Select = ({ label, name, options, required, form, set, errors }) => (
  <div className="form-group">
    <label className="form-label">{label}{required && <span style={{ color: 'var(--danger)', marginLeft: 2 }}>*</span>}</label>
    <select className="form-control" name={name} value={form[name] ?? ''} onChange={set}>
      <option value="">— Select —</option>
      {options.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
    </select>
    {errors[name] && <div style={{ color: 'var(--danger)', fontSize: 12, marginTop: 3 }}>{errors[name]}</div>}
  </div>
)

const Section = ({ title, children }) => (
  <div style={{ marginBottom: 24 }}>
    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
      <div style={{ fontWeight: 700, fontSize: 13, color: 'var(--primary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{title}</div>
      <div style={{ flex: 1, height: 1, background: 'var(--border)' }} />
    </div>
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0 16px' }}>
      {children}
    </div>
  </div>
)

export default function EmployeeForm() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [form, setForm] = useState({ ...INIT, employee_id: genEmpId() })
  const [departments, setDepartments] = useState([])
  const [errors, setErrors] = useState({})
  const [saving, setSaving] = useState(false)
  const isEdit = Boolean(id)

  useEffect(() => {
    getDepartments().then(r => setDepartments(r.data.results ?? r.data))
    if (isEdit) getEmployeeById(id).then(r => setForm(r.data))
  }, [id])

  const set = e => setForm(f => ({ ...f, [e.target.name]: e.target.value }))

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSaving(true)
    setErrors({})
    try {
      isEdit ? await updateEmployee(id, form) : await createEmployee(form)
      navigate('/hr/employees')
    } catch (err) {
      setErrors(err.response?.data || {})
    } finally { setSaving(false) }
  }

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">{isEdit ? 'Edit Employee' : 'Add Employee'}</h1>
          <p className="page-subtitle">{isEdit ? `Editing record for ${form.first_name} ${form.last_name}` : 'Fill in the details to register a new employee'}</p>
        </div>
        <button className="btn btn-outline" onClick={() => navigate('/hr/employees')}>← Back</button>
      </div>

      <div className="card">
        <div className="card-body">
          <form onSubmit={handleSubmit}>

            <Section title="Personal Information">
              <Field label="First Name" name="first_name" required form={form} set={set} errors={errors} />
              <Field label="Last Name" name="last_name" required form={form} set={set} errors={errors} />
              <Field label="Email" name="email" type="email" required form={form} set={set} errors={errors} />
              <Field label="Phone" name="phone" placeholder="e.g. 9876543210" form={form} set={set} errors={errors} />
              <Select label="Gender" name="gender" options={[['male','Male'],['female','Female'],['other','Other']]} form={form} set={set} errors={errors} />
              <Field label="Date of Birth" name="date_of_birth" type="date" form={form} set={set} errors={errors} />
              <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                <label className="form-label">Address</label>
                <textarea className="form-control" name="address" value={form.address} onChange={set} rows={2} placeholder="Full address" />
              </div>
            </Section>

            <Section title="Employment Details">
              <div className="form-group">
                <label className="form-label">Employee ID <span style={{ color: 'var(--danger)', marginLeft: 2 }}>*</span></label>
                <div style={{ display: 'flex', gap: 6 }}>
                  <input className="form-control" name="employee_id" value={form.employee_id} onChange={set} required />
                  {!isEdit && (
                    <button type="button" className="btn btn-outline btn-sm" style={{ whiteSpace: 'nowrap' }}
                      onClick={() => setForm(f => ({ ...f, employee_id: genEmpId() }))}>
                      ↺ Generate
                    </button>
                  )}
                </div>
                {errors.employee_id && <div style={{ color: 'var(--danger)', fontSize: 12, marginTop: 3 }}>{errors.employee_id}</div>}
              </div>

              <div className="form-group">
                <label className="form-label">Department <span style={{ color: 'var(--danger)', marginLeft: 2 }}>*</span></label>
                <select className="form-control" name="department" value={form.department ?? ''} onChange={set} required>
                  <option value="">— Select Department —</option>
                  {departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                </select>
                {errors.department && <div style={{ color: 'var(--danger)', fontSize: 12, marginTop: 3 }}>{errors.department}</div>}
              </div>

              <Field label="Designation" name="designation" required placeholder="e.g. Professor, Clerk" form={form} set={set} errors={errors} />
              <Select label="Employment Type" name="employment_type" required
                options={[['full_time','Full Time'],['part_time','Part Time'],['contract','Contract']]} form={form} set={set} errors={errors} />
              <Field label="Date of Joining" name="date_of_joining" type="date" required form={form} set={set} errors={errors} />
              <Field label="Basic Salary (₹)" name="basic_salary" type="number" required placeholder="e.g. 45000" form={form} set={set} errors={errors} />
              <Select label="Status" name="status" required
                options={[['active','Active'],['inactive','Inactive'],['terminated','Terminated']]} form={form} set={set} errors={errors} />
            </Section>

            {/* Summary preview */}
            {(form.first_name || form.designation || form.basic_salary) && (
              <div style={{ background: '#f0f9ff', border: '1px solid #bae6fd', borderRadius: 10, padding: '12px 16px', marginBottom: 20, display: 'flex', gap: 24, flexWrap: 'wrap', fontSize: 13 }}>
                {form.first_name && <span><strong>Name:</strong> {form.first_name} {form.last_name}</span>}
                {form.designation && <span><strong>Role:</strong> {form.designation}</span>}
                {form.basic_salary && <span><strong>Salary:</strong> ₹{Number(form.basic_salary).toLocaleString()}</span>}
                {form.date_of_joining && <span><strong>Joining:</strong> {form.date_of_joining}</span>}
                {form.employment_type && <span><strong>Type:</strong> {form.employment_type.replace('_', ' ')}</span>}
              </div>
            )}

            <div style={{ display: 'flex', gap: 10 }}>
              <button className="btn btn-primary" type="submit" disabled={saving}>
                {saving ? 'Saving…' : isEdit ? 'Update Employee' : 'Add Employee'}
              </button>
              <button className="btn btn-outline" type="button" onClick={() => navigate('/hr/employees')}>Cancel</button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
