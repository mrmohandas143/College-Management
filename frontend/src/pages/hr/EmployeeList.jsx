import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { getEmployees, deleteEmployee } from '../../services/hrService'
import { getDepartments } from '../../services/departmentService'

const STATUS_STYLE = {
  active:     { bg: '#dcfce7', color: '#15803d' },
  inactive:   { bg: '#fef9c3', color: '#854d0e' },
  terminated: { bg: '#fee2e2', color: '#dc2626' },
}

const TYPE_LABEL = { full_time: 'Full Time', part_time: 'Part Time', contract: 'Contract' }

function ActionMenu({ items }) {
  const [open, setOpen] = useState(false)
  return (
    <div style={{ position: 'relative', display: 'inline-block' }}>
      <button onClick={() => setOpen(o => !o)} className="btn btn-outline btn-sm"
        style={{ padding: '4px 10px', fontSize: 18, lineHeight: 1 }}>⋮</button>
      {open && (
        <>
          <div onClick={() => setOpen(false)} style={{ position: 'fixed', inset: 0, zIndex: 10 }} />
          <div style={{ position: 'absolute', right: 0, top: '110%', zIndex: 20, background: '#fff', border: '1px solid var(--border)', borderRadius: 8, boxShadow: '0 4px 16px rgba(0,0,0,0.12)', minWidth: 150, overflow: 'hidden' }}>
            {items.map((item, i) => (
              <button key={i} onClick={() => { setOpen(false); item.onClick() }}
                style={{ display: 'flex', alignItems: 'center', gap: 8, width: '100%', padding: '9px 14px', background: 'none', border: 'none', cursor: 'pointer', fontSize: 13, color: item.danger ? '#dc2626' : 'var(--text)', borderTop: i > 0 ? '1px solid var(--border)' : 'none' }}>
                {item.icon && <span>{item.icon}</span>}
                {item.label}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  )
}

export default function EmployeeList() {
  const [employees, setEmployees] = useState([])
  const [departments, setDepartments] = useState([])
  const [params, setParams] = useState({ search: '', department: '', status: '' })
  const [loading, setLoading] = useState(true)
  const navigate = useNavigate()

  const load = async (p = params) => {
    setLoading(true)
    try {
      const res = await getEmployees(Object.fromEntries(Object.entries(p).filter(([, v]) => v)))
      setEmployees(res.data.results ?? res.data)
    } finally { setLoading(false) }
  }

  useEffect(() => {
    getDepartments().then(r => setDepartments(r.data.results ?? r.data))
    load()
  }, [])

  const set = e => setParams(p => ({ ...p, [e.target.name]: e.target.value }))

  const handleDelete = async (emp) => {
    if (!confirm(`Delete ${emp.first_name} ${emp.last_name}?`)) return
    await deleteEmployee(emp.id)
    load()
  }

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Employees</h1>
          <p className="page-subtitle">{employees.length} records</p>
        </div>
        <button className="btn btn-primary" onClick={() => navigate('/hr/employees/add')}>+ Add Employee</button>
      </div>

      <div className="card">
        <div className="card-body">
          {/* Filters */}
          <div style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap' }}>
            <input className="form-control" style={{ flex: 2, minWidth: 180 }}
              placeholder="Search name, email, ID…" name="search" value={params.search}
              onChange={e => { set(e); setTimeout(() => load({ ...params, search: e.target.value }), 400) }} />
            <select className="form-control" style={{ flex: 1, minWidth: 140 }} name="department" value={params.department}
              onChange={e => { set(e); load({ ...params, department: e.target.value }) }}>
              <option value="">All Departments</option>
              {departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
            </select>
            <select className="form-control" style={{ flex: 1, minWidth: 120 }} name="status" value={params.status}
              onChange={e => { set(e); load({ ...params, status: e.target.value }) }}>
              <option value="">All Status</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
              <option value="terminated">Terminated</option>
            </select>
          </div>

          {loading ? <div className="loader" /> : (
            <div className="table-responsive">
              <table className="table">
                <thead>
                  <tr>
                    <th>Employee</th>
                    <th>Department</th>
                    <th>Designation</th>
                    <th>Type</th>
                    <th>Joined</th>
                    <th>Salary</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {employees.length === 0
                    ? <tr><td colSpan={8} style={{ textAlign: 'center', color: 'var(--text-muted)', padding: 32 }}>No employees found</td></tr>
                    : employees.map(emp => {
                      const st = STATUS_STYLE[emp.status] || {}
                      return (
                        <tr key={emp.id}>
                          <td>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                              <div style={{ width: 34, height: 34, borderRadius: '50%', background: 'var(--primary)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: 13, flexShrink: 0 }}>
                                {emp.first_name?.[0]}{emp.last_name?.[0]}
                              </div>
                              <div>
                                <div style={{ fontWeight: 600, fontSize: 13 }}>{emp.first_name} {emp.last_name}</div>
                                <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{emp.employee_id} · {emp.email}</div>
                              </div>
                            </div>
                          </td>
                          <td style={{ fontSize: 13 }}>{emp.department_name || '—'}</td>
                          <td style={{ fontSize: 13 }}>{emp.designation}</td>
                          <td style={{ fontSize: 13 }}>{TYPE_LABEL[emp.employment_type] || emp.employment_type}</td>
                          <td style={{ fontSize: 13, color: 'var(--text-muted)' }}>{emp.date_of_joining}</td>
                          <td style={{ fontSize: 13, fontWeight: 600 }}>₹{Number(emp.basic_salary).toLocaleString()}</td>
                          <td>
                            <span style={{ padding: '2px 10px', borderRadius: 999, fontSize: 11, fontWeight: 600, background: st.bg, color: st.color }}>
                              {emp.status}
                            </span>
                          </td>
                          <td>
                            <ActionMenu items={[
                              { icon: '👁', label: 'View Profile',  onClick: () => navigate(`/hr/employees/${emp.id}`) },
                              { icon: '✏️', label: 'Edit',          onClick: () => navigate(`/hr/employees/${emp.id}/edit`) },
                              { icon: '📅', label: 'Attendance',    onClick: () => navigate(`/hr/attendance?employee=${emp.id}`) },
                              { icon: '🏖', label: 'Leaves',        onClick: () => navigate(`/hr/leaves?employee=${emp.id}`) },
                              { icon: '💰', label: 'Payroll',       onClick: () => navigate(`/hr/payroll?employee=${emp.id}`) },
                              { icon: '🗑', label: 'Delete',        onClick: () => handleDelete(emp), danger: true },
                            ]} />
                          </td>
                        </tr>
                      )
                    })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
