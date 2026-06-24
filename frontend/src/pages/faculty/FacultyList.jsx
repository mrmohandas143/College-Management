import { useEffect, useState, useRef } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { getFaculty, deleteFaculty } from '../../services/facultyService'
import Loader from '../../components/Loader'
import useAuth from '../../hooks/useAuth'
import { statusBadge } from '../../utils/helpers'
import api from '../../api/axios'

// ── Permission catalogue split by tier ──────────────────────────────────────
export const PERMISSION_TIERS = [
  {
    tier: 'most_priority',
    label: 'Most Priority',
    color: '#dc2626',
    bg: '#fef2f2',
    border: '#fecaca',
    items: [
      { key: 'manage_users',      label: 'Manage Users' },
      { key: 'manage_roles',      label: 'Manage Roles' },
      { key: 'system_settings',   label: 'System Settings' },
      { key: 'view_all_reports',  label: 'View All Reports' },
    ],
  },
  {
    tier: 'priority',
    label: 'Priority',
    color: '#d97706',
    bg: '#fffbeb',
    border: '#fde68a',
    items: [
      { key: 'manage_students',   label: 'Manage Students' },
      { key: 'manage_faculty',    label: 'Manage Faculty' },
      { key: 'manage_fees',       label: 'Manage Fees' },
      { key: 'manage_hr',         label: 'Manage HR & Payroll' },
      { key: 'manage_exams',      label: 'Manage Examinations' },
    ],
  },
  {
    tier: 'medium',
    label: 'Medium',
    color: '#2563eb',
    bg: '#eff6ff',
    border: '#bfdbfe',
    items: [
      { key: 'manage_attendance', label: 'Manage Attendance' },
      { key: 'manage_timetable',  label: 'Manage Timetable' },
      { key: 'manage_library',    label: 'Manage Library' },
      { key: 'manage_hostel',     label: 'Manage Hostel' },
      { key: 'manage_transport',  label: 'Manage Transport' },
    ],
  },
  {
    tier: 'common',
    label: 'Common Access',
    color: '#059669',
    bg: '#f0fdf4',
    border: '#bbf7d0',
    items: [
      { key: 'view_students',     label: 'View Students' },
      { key: 'view_faculty',      label: 'View Faculty' },
      { key: 'view_timetable',    label: 'View Timetable' },
      { key: 'view_notices',      label: 'View Notices' },
      { key: 'manage_placement',  label: 'Manage Placement' },
      { key: 'manage_alumni',     label: 'Manage Alumni' },
    ],
  },
]

const PREDEFINED_ROLES = [
  { value: 'faculty',            label: 'Faculty' },
  { value: 'hr',                 label: 'HR' },
  { value: 'accountant',         label: 'Accountant' },
  { value: 'librarian',          label: 'Librarian' },
  { value: 'hostel_warden',      label: 'Hostel Warden' },
  { value: 'placement_officer',  label: 'Placement Officer' },
  { value: 'transport_incharge', label: 'Transport Incharge' },
  { value: 'alumni_coordinator', label: 'Alumni Coordinator' },
]

const ROLE_COLOR = {
  faculty: '#d97706', hr: '#0891b2', accountant: '#059669',
  librarian: '#db2777', hostel_warden: '#ea580c',
  placement_officer: '#16a34a', transport_incharge: '#0284c7',
  alumni_coordinator: '#9333ea', custom: '#7c3aed',
}

// ── Permission Checkbox Grid ─────────────────────────────────────────────────
export function PermissionGrid({ selected, onChange }) {
  const toggle = (key) => {
    onChange(selected.includes(key) ? selected.filter(k => k !== key) : [...selected, key])
  }
  const toggleTier = (items) => {
    const keys = items.map(i => i.key)
    const allOn = keys.every(k => selected.includes(k))
    onChange(allOn ? selected.filter(k => !keys.includes(k)) : [...new Set([...selected, ...keys])])
  }

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 10 }}>
      {PERMISSION_TIERS.map(tier => {
        const keys = tier.items.map(i => i.key)
        const allOn = keys.every(k => selected.includes(k))
        const someOn = keys.some(k => selected.includes(k))
        return (
          <div key={tier.tier} style={{ border: `1.5px solid ${tier.border}`, borderRadius: 10, background: tier.bg, padding: '10px 12px' }}>
            {/* Tier header with select-all */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8, paddingBottom: 6, borderBottom: `1px solid ${tier.border}` }}>
              <input type="checkbox" checked={allOn} ref={el => { if (el) el.indeterminate = someOn && !allOn }}
                onChange={() => toggleTier(tier.items)} style={{ accentColor: tier.color, width: 14, height: 14 }} />
              <span style={{ fontWeight: 700, fontSize: 12, color: tier.color, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                {tier.label}
              </span>
            </div>
            {tier.items.map(item => (
              <label key={item.key} style={{ display: 'flex', alignItems: 'center', gap: 7, fontSize: 12.5, color: '#374151', cursor: 'pointer', padding: '3px 0' }}>
                <input type="checkbox" checked={selected.includes(item.key)} onChange={() => toggle(item.key)}
                  style={{ accentColor: tier.color, width: 13, height: 13 }} />
                {item.label}
              </label>
            ))}
          </div>
        )
      })}
    </div>
  )
}

// ── Helpers ──────────────────────────────────────────────────────────────────
function ActionMenu({ items }) {
  const [open, setOpen] = useState(false)
  const ref = useRef(null)

  useEffect(() => {
    if (!ref.current) return
    const row = ref.current.closest('tr')
    if (row) {
      if (open) {
        row.style.zIndex = '30'
        row.style.position = 'relative'
      } else {
        row.style.zIndex = ''
        row.style.position = ''
      }
    }
  }, [open])

  return (
    <div ref={ref} style={{ position: 'relative', display: 'inline-block' }}>
      <button onClick={() => setOpen(o => !o)}
        style={{ background: 'none', border: '1px solid var(--border)', borderRadius: 6, padding: '4px 10px', cursor: 'pointer', fontSize: 18, lineHeight: 1, color: 'var(--text)' }}>⋮</button>
      {open && (
        <>
          <div onClick={() => setOpen(false)} style={{ position: 'fixed', inset: 0, zIndex: 10 }} />
          <div style={{ position: 'absolute', right: 0, top: '110%', zIndex: 20, background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 8, boxShadow: '0 4px 20px rgba(0,0,0,0.13)', minWidth: 165, overflow: 'hidden' }}>
            {items.map((item, i) => (
              <button key={i} onClick={() => { setOpen(false); item.onClick() }}
                style={{ display: 'flex', width: '100%', padding: '10px 14px', background: 'none', border: 'none', borderTop: i > 0 ? '1px solid var(--border)' : 'none', cursor: 'pointer', fontSize: 13, color: item.danger ? '#dc2626' : 'var(--text)', textAlign: 'left' }}>
                {item.label}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  )
}

const RoleBadge = ({ role, label }) => (
  <span style={{
    display: 'inline-block', padding: '2px 10px', borderRadius: 999, fontSize: 11, fontWeight: 600,
    background: (ROLE_COLOR[role] || '#666') + '18',
    color: ROLE_COLOR[role] || '#666',
    border: `1px solid ${(ROLE_COLOR[role] || '#666')}40`,
  }}>
    {label || PREDEFINED_ROLES.find(r => r.value === role)?.label || role}
  </span>
)

const StepBar = ({ step }) => (
  <div style={{ display: 'flex', alignItems: 'center', marginBottom: 20 }}>
    {[{ n: 1, label: 'Role' }, { n: 2, label: 'Permissions' }, { n: 3, label: 'Password' }].map(({ n, label }, i) => (
      <div key={n} style={{ display: 'flex', alignItems: 'center', flex: 1 }}>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flex: 1 }}>
          <div style={{
            width: 28, height: 28, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontWeight: 700, fontSize: 13,
            background: step > n ? '#16a34a' : step === n ? 'var(--primary)' : 'var(--border)',
            color: step >= n ? '#fff' : 'var(--text-muted)',
          }}>
            {step > n ? '✓' : n}
          </div>
          <div style={{ fontSize: 11, marginTop: 4, color: step === n ? 'var(--primary)' : 'var(--text-muted)', fontWeight: step === n ? 600 : 400 }}>{label}</div>
        </div>
        {i < 2 && <div style={{ height: 2, flex: 1, background: step > n ? '#16a34a' : 'var(--border)', marginBottom: 18, marginLeft: -8, marginRight: -8 }} />}
      </div>
    ))}
  </div>
)

// ── Main Component ───────────────────────────────────────────────────────────
export default function FacultyList() {
  const { user } = useAuth()
  const isAdmin = ['super_admin', 'admin'].includes(user?.role)
  const [faculty, setFaculty] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const navigate = useNavigate()

  // Modal state
  const [modal, setModal] = useState(null)
  const [step, setStep] = useState(1)
  const [roleType, setRoleType] = useState('predefined')   // 'predefined' | 'custom'
  const [selectedRole, setSelectedRole] = useState('')
  const [customRoleName, setCustomRoleName] = useState('')
  const [customRoles, setCustomRoles] = useState([])
  const [selectedCustomRoleId, setSelectedCustomRoleId] = useState('')
  const [permissions, setPermissions] = useState([])
  const [pwForm, setPwForm] = useState({ username: '', password: '', confirm: '' })
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)
  const [showPw, setShowPw] = useState(false)
  const [done, setDone] = useState(false)

  const load = (q = '') => {
    setLoading(true)
    getFaculty(q).then(r => setFaculty(r.data)).finally(() => setLoading(false))
  }

  const loadCustomRoles = () => api.get('/accounts/custom-roles/').then(r => setCustomRoles(r.data))

  useEffect(() => { load(); loadCustomRoles() }, [])
  useEffect(() => { const t = setTimeout(() => load(search), 400); return () => clearTimeout(t) }, [search])

  const handleDelete = async (id, name) => {
    if (!confirm(`Delete ${name}?`)) return
    await deleteFaculty(id)
    load(search)
  }

  const openModal = (f) => {
    setModal(f); setStep(1); setRoleType('predefined')
    setSelectedRole(f.assigned_role || ''); setCustomRoleName('')
    setSelectedCustomRoleId(''); setPermissions([])
    setPwForm({ username: '', password: '', confirm: '' })
    setError(''); setSaving(false); setShowPw(false); setDone(false)
  }

  const closeModal = () => { setModal(null); if (done) load(search) }

  // Step 1 → 2: assign role (predefined via legacy endpoint, custom just store locally)
  const handleStep1 = async (e) => {
    e.preventDefault()
    setError('')
    if (roleType === 'predefined') {
      if (!selectedRole) return setError('Please select a role.')
      setSaving(true)
      try {
        await api.post('/accounts/assign-role/', { email: modal.email, role: selectedRole })
        setStep(2)
      } catch (err) {
        setError(err.response?.data?.error || 'Failed to assign role.')
      } finally { setSaving(false) }
    } else {
      // custom role — just move to permissions step
      if (!selectedCustomRoleId && !customRoleName.trim()) return setError('Select an existing custom role or enter a new role name.')
      if (selectedCustomRoleId) {
        const cr = customRoles.find(r => r.id === +selectedCustomRoleId)
        if (cr) setPermissions(cr.permissions)
      }
      setStep(2)
    }
  }

  // Step 2 → 3
  const handleStep2 = (e) => {
    e.preventDefault()
    setStep(3)
  }

  // Step 3: set password + save custom role + update permissions
  const handleStep3 = async (e) => {
    e.preventDefault()
    if (pwForm.password !== pwForm.confirm) return setError('Passwords do not match.')
    setSaving(true); setError('')
    try {
      if (roleType === 'custom') {
        // Create or update custom role
        let crId = selectedCustomRoleId ? +selectedCustomRoleId : null
        if (!crId && customRoleName.trim()) {
          const res = await api.post('/accounts/custom-roles/create/', { name: customRoleName.trim(), permissions })
          crId = res.data.id
          loadCustomRoles()
        } else if (crId) {
          await api.patch(`/accounts/custom-roles/${crId}/`, { permissions })
        }
        // Convert faculty to user with custom role
        await api.post('/accounts/convert-faculty/', {
          faculty_id: modal.id,
          username: pwForm.username,
          password: pwForm.password,
          role: 'custom',
          custom_role_id: crId,
          custom_permissions: permissions,
        })
      } else {
        // Predefined: set password + update permissions
        await api.post('/accounts/set-user-password/', {
          username: pwForm.username,
          password: pwForm.password,
          email: modal.email,
        })
        // Update permissions on the user
        const userRes = await api.get('/accounts/users/')
        const u = userRes.data.find(x => x.email === modal.email)
        if (u) await api.patch(`/accounts/users/${u.id}/`, { custom_permissions: permissions })
      }
      setDone(true); load(search)
    } catch (err) {
      const d = err.response?.data
      setError(d ? (d.error || Object.values(d).flat().join(' ')) : 'Failed.')
    } finally { setSaving(false) }
  }

  return (
    <div>
      <div className="page-header">
        <div><h1>Users</h1><p>{faculty.length} total users</p></div>
        {isAdmin && <Link to="/faculty/add" className="btn btn-primary">+ Add User</Link>}
      </div>

      <div className="card">
        <div className="toolbar">
          <div className="search-bar">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/></svg>
            <input placeholder="Search users..." value={search} onChange={e => setSearch(e.target.value)} />
          </div>
        </div>

        {loading ? <Loader /> : faculty.length === 0 ? (
          <div className="empty-state">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
            <p>No users found</p>
          </div>
        ) : (
          <div className="table-wrap">
            <table>
              <thead>
                <tr><th>Name</th><th>Department</th><th>Qualification</th><th>Designation</th><th>Role</th><th>Status</th><th>Actions</th></tr>
              </thead>
              <tbody>
                {faculty.map(f => (
                  <tr key={f.id}>
                    <td>
                      <div style={{ fontWeight: 500 }}>{f.first_name} {f.last_name}</div>
                      <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{f.email}</div>
                    </td>
                    <td>{f.department}</td>
                    <td>{f.qualification || '—'}</td>
                    <td>{f.designation}</td>
                    <td>
                      {f.assigned_role
                        ? <RoleBadge role={f.assigned_role} label={f.assigned_role_label} />
                        : <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>Not assigned</span>
                      }
                    </td>
                    <td><span className={`badge ${statusBadge(f.status)}`}>{f.status}</span></td>
                    <td>
                      <ActionMenu items={[
                        { label: 'View',             onClick: () => navigate(`/faculty/${f.id}`) },
                        ...(isAdmin ? [
                          { label: 'Edit',           onClick: () => navigate(`/faculty/${f.id}/edit`) },
                          { label: 'Assign Role',    onClick: () => openModal(f) },
                          { label: 'Delete',         onClick: () => handleDelete(f.id, `${f.first_name} ${f.last_name}`), danger: true },
                        ] : []),
                      ]} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ── 3-Step Modal ── */}
      {modal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: 16, overflowY: 'auto' }}>
          <div className="card" style={{ width: '100%', maxWidth: step === 2 ? 700 : 480, margin: 'auto' }}>
            <div className="card-body">

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                <h3 style={{ margin: 0 }}>Setup User Access</h3>
                <button onClick={closeModal} className="btn btn-outline btn-sm">✕</button>
              </div>

              {/* Faculty info */}
              <div style={{ background: 'var(--bg)', borderRadius: 8, padding: '10px 14px', marginBottom: 16, fontSize: 13 }}>
                <div style={{ fontWeight: 600 }}>{modal.first_name} {modal.last_name}</div>
                <div style={{ color: 'var(--text-muted)' }}>{modal.email} &nbsp;|&nbsp; {modal.designation}</div>
              </div>

              {!done && <StepBar step={step} />}
              {error && <div className="alert alert-error" style={{ marginBottom: 12 }}>{error}</div>}

              {/* ── Step 1: Role ── */}
              {!done && step === 1 && (
                <form onSubmit={handleStep1}>
                  {/* Toggle predefined / custom */}
                  <div style={{ display: 'flex', gap: 8, marginBottom: 14 }}>
                    {['predefined', 'custom'].map(t => (
                      <button key={t} type="button"
                        onClick={() => { setRoleType(t); setError('') }}
                        className={`btn btn-sm ${roleType === t ? 'btn-primary' : 'btn-outline'}`}>
                        {t === 'predefined' ? 'Predefined Role' : 'Custom Role'}
                      </button>
                    ))}
                  </div>

                  {roleType === 'predefined' ? (
                    <div className="form-group">
                      <label className="form-label">Select Role <span style={{ color: 'var(--danger)' }}>*</span></label>
                      <select className="form-control" value={selectedRole} onChange={e => setSelectedRole(e.target.value)} required>
                        <option value="" disabled>-- Select Role --</option>
                        {PREDEFINED_ROLES.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
                      </select>
                    </div>
                  ) : (
                    <>
                      <div className="form-group">
                        <label className="form-label">Existing Custom Role</label>
                        <select className="form-control" value={selectedCustomRoleId} onChange={e => { setSelectedCustomRoleId(e.target.value); setCustomRoleName('') }}>
                          <option value="">-- Select existing or create new --</option>
                          {customRoles.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
                        </select>
                      </div>
                      {!selectedCustomRoleId && (
                        <div className="form-group">
                          <label className="form-label">New Role Name</label>
                          <input className="form-control" placeholder="e.g. Lab Coordinator" value={customRoleName}
                            onChange={e => setCustomRoleName(e.target.value)} />
                        </div>
                      )}
                    </>
                  )}

                  <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 16 }}>
                    <button type="button" className="btn btn-outline" onClick={closeModal}>Cancel</button>
                    <button type="submit" className="btn btn-primary" disabled={saving}>{saving ? 'Saving…' : 'Next: Permissions →'}</button>
                  </div>
                </form>
              )}

              {/* ── Step 2: Permissions ── */}
              {!done && step === 2 && (
                <form onSubmit={handleStep2}>
                  <div style={{ marginBottom: 12, fontSize: 13, color: 'var(--text-muted)' }}>
                    Select the features this user can access. Each box is a priority tier.
                  </div>
                  <PermissionGrid selected={permissions} onChange={setPermissions} />
                  <div style={{ marginTop: 10, fontSize: 12, color: 'var(--text-muted)' }}>
                    {permissions.length} permission{permissions.length !== 1 ? 's' : ''} selected
                  </div>
                  <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 16 }}>
                    <button type="button" className="btn btn-outline" onClick={() => { setStep(1); setError('') }}>← Back</button>
                    <button type="submit" className="btn btn-primary">Next: Set Password →</button>
                  </div>
                </form>
              )}

              {/* ── Step 3: Password ── */}
              {!done && step === 3 && (
                <form onSubmit={handleStep3}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
                    <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>Role:</span>
                    {roleType === 'predefined'
                      ? <RoleBadge role={selectedRole} />
                      : <RoleBadge role="custom" label={customRoleName || customRoles.find(r => r.id === +selectedCustomRoleId)?.name || 'Custom'} />
                    }
                    <span style={{ fontSize: 12, color: 'var(--text-muted)', marginLeft: 4 }}>· {permissions.length} permissions</span>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Username <span style={{ color: 'var(--danger)' }}>*</span></label>
                    <input className="form-control" value={pwForm.username} onChange={e => setPwForm(f => ({ ...f, username: e.target.value }))} required />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Password <span style={{ color: 'var(--danger)' }}>*</span></label>
                    <div style={{ position: 'relative' }}>
                      <input className="form-control" type={showPw ? 'text' : 'password'} value={pwForm.password}
                        onChange={e => setPwForm(f => ({ ...f, password: e.target.value }))} required minLength={6} style={{ paddingRight: 40 }} />
                      <button type="button" onClick={() => setShowPw(s => !s)}
                        style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}>
                        {showPw
                          ? <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19m-6.72-1.07a3 3 0 11-4.24-4.24M1 1l22 22" /></svg>
                          : <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" /><circle cx="12" cy="12" r="3" /></svg>
                        }
                      </button>
                    </div>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Confirm Password <span style={{ color: 'var(--danger)' }}>*</span></label>
                    <input className="form-control" type={showPw ? 'text' : 'password'} value={pwForm.confirm}
                      onChange={e => setPwForm(f => ({ ...f, confirm: e.target.value }))} required minLength={6} />
                  </div>
                  <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 8 }}>
                    <button type="button" className="btn btn-outline" onClick={() => { setStep(2); setError('') }}>← Back</button>
                    <button type="submit" className="btn btn-primary" disabled={saving}>{saving ? 'Saving…' : 'Finish Setup'}</button>
                  </div>
                </form>
              )}

              {/* ── Done ── */}
              {done && (
                <div style={{ textAlign: 'center', padding: '16px 0' }}>
                  <div style={{ fontSize: 40, marginBottom: 10 }}>✅</div>
                  <div style={{ fontWeight: 600, fontSize: 15, marginBottom: 6 }}>Setup Complete!</div>
                  <div style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 16 }}>
                    <strong>{modal.first_name} {modal.last_name}</strong> has been converted to a system user with {permissions.length} permission{permissions.length !== 1 ? 's' : ''}.
                  </div>
                  <button onClick={closeModal} className="btn btn-primary">Done</button>
                </div>
              )}

            </div>
          </div>
        </div>
      )}
    </div>
  )
}
