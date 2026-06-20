import { useState, useEffect } from 'react'
import api from '../../api/axios'
import { PermissionGrid } from '../faculty/FacultyList'

function ActionMenu({ items }) {
  const [open, setOpen] = useState(false)
  return (
    <div style={{ position: 'relative', display: 'inline-block' }}>
      <button
        onClick={() => setOpen(o => !o)}
        style={{ background: 'none', border: '1px solid var(--border)', borderRadius: 6, padding: '4px 10px', cursor: 'pointer', fontSize: 18, lineHeight: 1, color: 'var(--text)' }}
      >⋮</button>
      {open && (
        <>
          <div onClick={() => setOpen(false)} style={{ position: 'fixed', inset: 0, zIndex: 10 }} />
          <div style={{ position: 'absolute', right: 0, top: '110%', zIndex: 20, background: '#fff', border: '1px solid var(--border)', borderRadius: 8, boxShadow: '0 4px 20px rgba(0,0,0,0.13)', minWidth: 175, overflow: 'hidden' }}>
            {items.map((item, i) => (
              <button key={i} onClick={() => { setOpen(false); item.onClick() }}
                style={{ display: 'flex', alignItems: 'center', width: '100%', padding: '10px 14px', background: 'none', border: 'none', borderTop: i > 0 ? '1px solid var(--border)' : 'none', cursor: 'pointer', fontSize: 13, color: item.danger ? '#dc2626' : 'var(--text)', textAlign: 'left' }}>
                {item.label}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  )
}

const ROLES = [
  { value: 'super_admin',        label: 'Super Admin' },
  { value: 'admin',              label: 'Admin' },
  { value: 'hr',                 label: 'HR' },
  { value: 'accountant',         label: 'Accountant' },
  { value: 'faculty',            label: 'Faculty' },
  { value: 'librarian',          label: 'Librarian' },
  { value: 'hostel_warden',      label: 'Hostel Warden' },
  { value: 'placement_officer',  label: 'Placement Officer' },
  { value: 'transport_incharge', label: 'Transport Incharge' },
  { value: 'alumni_coordinator', label: 'Alumni Coordinator' },
  { value: 'custom',             label: 'Custom' },
]

const ROLE_COLOR = {
  super_admin: '#7c3aed', admin: '#2563eb', hr: '#0891b2',
  accountant: '#059669', faculty: '#d97706', librarian: '#db2777',
  hostel_warden: '#ea580c', placement_officer: '#16a34a',
  transport_incharge: '#0284c7', alumni_coordinator: '#9333ea',
  custom: '#7c3aed',
}

export default function UserManagement() {
  const [users, setUsers]           = useState([])
  const [loading, setLoading]       = useState(true)
  const [showCreate, setShowCreate] = useState(false)
  const [pwModal, setPwModal]       = useState(null)
  const [roleModal, setRoleModal]   = useState(null)
  const [permModal, setPermModal]   = useState(null)   // { user, permissions[] }
  const [createForm, setCreateForm] = useState({ username: '', email: '', roleName: '', password: '', confirm: '', permissions: [] })
  const [pwForm, setPwForm]         = useState({ password: '', confirm: '' })
  const [newRole, setNewRole]       = useState('')
  const [customRoles, setCustomRoles] = useState([])
  const [error, setError]           = useState('')
  const [success, setSuccess]       = useState('')
  const [saving, setSaving]         = useState(false)
  const [showPw, setShowPw]         = useState(false)
  const [filterRole, setFilterRole] = useState('')

  const load = async () => {
    setLoading(true)
    try { const res = await api.get('/accounts/users/'); setUsers(res.data) }
    finally { setLoading(false) }
  }

  const loadCustomRoles = () => api.get('/accounts/custom-roles/').then(r => setCustomRoles(r.data)).catch(() => {})

  useEffect(() => { load(); loadCustomRoles() }, [])

  const flash = (msg, isError = false) => {
    if (isError) { setError(msg); setSuccess('') }
    else { setSuccess(msg); setError('') }
    setTimeout(() => { setError(''); setSuccess('') }, 4000)
  }

  const handleCreate = async (e) => {
    e.preventDefault()
    if (createForm.password !== createForm.confirm) return flash('Passwords do not match.', true)
    if (!createForm.roleName.trim()) return flash('Role name is required.', true)
    setSaving(true)
    try {
      // Check if typed role matches a predefined role value or label
      const typed = createForm.roleName.trim().toLowerCase().replace(/\s+/g, '_')
      const predefined = ROLES.find(r => r.value === typed || r.label.toLowerCase() === createForm.roleName.trim().toLowerCase())

      let roleValue = 'custom'
      let customRoleId = null

      if (predefined && predefined.value !== 'custom') {
        roleValue = predefined.value
      } else {
        // Create or reuse custom role
        const existing = customRoles.find(r => r.name.toLowerCase() === createForm.roleName.trim().toLowerCase())
        if (existing) {
          customRoleId = existing.id
          // Update permissions on existing custom role
          await api.patch(`/accounts/custom-roles/${existing.id}/`, { permissions: createForm.permissions })
        } else {
          const res = await api.post('/accounts/custom-roles/create/', { name: createForm.roleName.trim(), permissions: createForm.permissions })
          customRoleId = res.data.id
          loadCustomRoles()
        }
      }

      await api.post('/accounts/users/create/', {
        username: createForm.username,
        email: createForm.email,
        role: roleValue,
        password: createForm.password,
        custom_permissions: createForm.permissions,
        ...(customRoleId ? { custom_role_id: customRoleId } : {}),
      })
      flash(`User "${createForm.username}" created successfully.`)
      setShowCreate(false)
      setCreateForm({ username: '', email: '', roleName: '', password: '', confirm: '', permissions: [] })
      load()
    } catch (err) {
      flash(err.response?.data?.error || 'Failed to create user.', true)
    } finally { setSaving(false) }
  }

  const handleSetPassword = async (e) => {
    e.preventDefault()
    if (pwForm.password !== pwForm.confirm) return flash('Passwords do not match.', true)
    setSaving(true)
    try {
      await api.post(`/accounts/users/${pwModal.id}/set-password/`, { password: pwForm.password })
      flash(`Password updated for "${pwModal.username}".`)
      setPwModal(null); setPwForm({ password: '', confirm: '' })
    } catch (err) {
      flash(err.response?.data?.error || 'Failed to update password.', true)
    } finally { setSaving(false) }
  }

  const handleChangeRole = async (e) => {
    e.preventDefault()
    setSaving(true)
    try {
      await api.patch(`/accounts/users/${roleModal.id}/`, { role: newRole })
      flash(`Role updated to "${newRole}" for "${roleModal.username}".`)
      setRoleModal(null); load()
    } catch (err) {
      flash(err.response?.data?.error || 'Failed to update role.', true)
    } finally { setSaving(false) }
  }

  const handleSavePermissions = async () => {
    setSaving(true)
    try {
      await api.patch(`/accounts/users/${permModal.user.id}/`, { custom_permissions: permModal.permissions })
      flash(`Permissions updated for "${permModal.user.username}".`)
      setPermModal(null); load()
    } catch (err) {
      flash(err.response?.data?.error || 'Failed to update permissions.', true)
    } finally { setSaving(false) }
  }

  const handleToggleActive = async (user) => {
    try {
      await api.patch(`/accounts/users/${user.id}/`, { is_active: !user.is_active })
      flash(`User "${user.username}" ${!user.is_active ? 'activated' : 'deactivated'}.`)
      load()
    } catch { flash('Failed to update status.', true) }
  }

  const handleDelete = async (user) => {
    if (!confirm(`Delete user "${user.username}"? This cannot be undone.`)) return
    try {
      await api.delete(`/accounts/users/${user.id}/delete/`)
      flash(`User "${user.username}" deleted.`); load()
    } catch (err) {
      flash(err.response?.data?.error || 'Failed to delete user.', true)
    }
  }

  const filtered = filterRole ? users.filter(u => u.role === filterRole) : users

  const RoleBadge = ({ role }) => (
    <span style={{
      display: 'inline-block', padding: '2px 10px', borderRadius: 999,
      fontSize: 11, fontWeight: 600,
      background: (ROLE_COLOR[role] || '#666') + '18',
      color: ROLE_COLOR[role] || '#666',
      border: `1px solid ${(ROLE_COLOR[role] || '#666')}40`,
    }}>
      {ROLES.find(r => r.value === role)?.label || role}
    </span>
  )

  const PwInput = ({ label, name, value, onChange }) => (
    <div className="form-group">
      <label className="form-label">{label}</label>
      <div style={{ position: 'relative' }}>
        <input className="form-control" type={showPw ? 'text' : 'password'}
          name={name} value={value} onChange={onChange}
          required minLength={6} placeholder="Min 6 characters" style={{ paddingRight: 40 }} />
        <button type="button" onClick={() => setShowPw(s => !s)}
          style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}>
          {showPw
            ? <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19m-6.72-1.07a3 3 0 11-4.24-4.24M1 1l22 22" /></svg>
            : <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" /><circle cx="12" cy="12" r="3" /></svg>
          }
        </button>
      </div>
    </div>
  )

  const Modal = ({ title, onClose, wide, children }) => (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: 16, overflowY: 'auto' }}>
      <div className="card" style={{ width: '100%', maxWidth: wide ? 720 : 460, margin: 'auto' }}>
        <div className="card-body">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <h3 style={{ margin: 0 }}>{title}</h3>
            <button className="btn btn-outline btn-sm" onClick={onClose}>✕</button>
          </div>
          {error && <div className="alert alert-error" style={{ marginBottom: 12 }}>{error}</div>}
          {children}
        </div>
      </div>
    </div>
  )

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">User Management</h1>
          <p className="page-subtitle">{users.length} system users — assign roles & permissions</p>
        </div>
        <button className="btn btn-primary" onClick={() => { setShowCreate(true); setError(''); setSuccess('') }}>
          + Create User
        </button>
      </div>

      {error   && <div className="alert alert-error" style={{ marginBottom: '1rem' }}>{error}</div>}
      {success && <div style={{ background: '#f0fdf4', color: '#166534', border: '1px solid #bbf7d0', borderRadius: 8, padding: '10px 14px', marginBottom: '1rem', fontSize: 14 }}>{success}</div>}

      {/* Role filter */}
      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem', flexWrap: 'wrap' }}>
        <button className={`btn btn-sm ${filterRole === '' ? 'btn-primary' : 'btn-outline'}`} onClick={() => setFilterRole('')}>All</button>
        {ROLES.map(r => (
          <button key={r.value} className={`btn btn-sm ${filterRole === r.value ? 'btn-primary' : 'btn-outline'}`} onClick={() => setFilterRole(r.value)}>
            {r.label}
          </button>
        ))}
      </div>

      <div className="card">
        <div className="card-body">
          {loading ? <div className="loader" /> : (
            <div className="table-responsive">
              <table className="table">
                <thead>
                  <tr>
                    <th>Username</th><th>Email</th><th>Role</th>
                    <th>Permissions</th><th>Last Login</th><th>Status</th><th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.length === 0
                    ? <tr><td colSpan={7} style={{ textAlign: 'center', color: 'var(--text-muted)' }}>No users found</td></tr>
                    : filtered.map(u => (
                      <tr key={u.id}>
                        <td>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                            <div style={{ width: 34, height: 34, borderRadius: '50%', background: (ROLE_COLOR[u.role] || '#666') + '20', color: ROLE_COLOR[u.role] || '#666', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: 13, flexShrink: 0 }}>
                              {u.username[0].toUpperCase()}
                            </div>
                            <span style={{ fontWeight: 600 }}>{u.username}</span>
                          </div>
                        </td>
                        <td style={{ color: 'var(--text-muted)', fontSize: 13 }}>{u.email || '—'}</td>
                        <td><RoleBadge role={u.role} /></td>
                        <td style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                          {u.custom_permissions?.length > 0
                            ? <span style={{ color: '#2563eb', fontWeight: 500 }}>{u.custom_permissions.length} permissions set</span>
                            : <span>—</span>
                          }
                        </td>
                        <td style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                          {u.last_login ? new Date(u.last_login).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : 'Never'}
                        </td>
                        <td>
                          <span style={{ padding: '2px 10px', borderRadius: 999, fontSize: 11, fontWeight: 600, background: u.is_active ? '#dcfce7' : '#fee2e2', color: u.is_active ? '#15803d' : '#dc2626' }}>
                            {u.is_active ? 'Active' : 'Inactive'}
                          </span>
                        </td>
                        <td>
                          <ActionMenu items={[
                            { label: 'Change Role',   onClick: () => { setRoleModal(u); setNewRole(u.role); setError('') } },
                            { label: 'Permissions',   onClick: () => { setPermModal({ user: u, permissions: u.custom_permissions || [] }); setError('') } },
                            { label: 'Set Password',  onClick: () => { setPwModal(u); setPwForm({ password: '', confirm: '' }); setShowPw(false); setError('') } },
                            { label: u.is_active ? 'Deactivate' : 'Activate', onClick: () => handleToggleActive(u) },
                            { label: 'Delete',        onClick: () => handleDelete(u), danger: true },
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

      {/* ── Create User Modal ── */}
      {showCreate && (
        <Modal title="Create New User" onClose={() => setShowCreate(false)} wide>
          <form onSubmit={handleCreate}>
            {/* Row: username + email */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div className="form-group" style={{ margin: 0 }}>
                <label className="form-label">Username <span style={{ color: 'var(--danger)' }}>*</span></label>
                <input className="form-control" value={createForm.username} onChange={e => setCreateForm(f => ({ ...f, username: e.target.value }))} required placeholder="e.g. john_doe" />
              </div>
              <div className="form-group" style={{ margin: 0 }}>
                <label className="form-label">Email</label>
                <input className="form-control" type="email" value={createForm.email} onChange={e => setCreateForm(f => ({ ...f, email: e.target.value }))} placeholder="optional" />
              </div>
            </div>

            {/* Role — dropdown */}
            <div className="form-group" style={{ marginTop: 12 }}>
              <label className="form-label">Role <span style={{ color: 'var(--danger)' }}>*</span></label>
              <select
                className="form-control"
                value={createForm.roleName}
                onChange={e => setCreateForm(f => ({ ...f, roleName: e.target.value, permissions: [] }))}
                required
              >
                <option value="">— Select a role —</option>
                {ROLES.filter(r => r.value !== 'custom').map(r => <option key={r.value} value={r.label}>{r.label}</option>)}
                {customRoles.map(r => <option key={r.id} value={r.name}>{r.name}</option>)}
              </select>
            </div>

            {/* Permission grid — always visible once role is typed */}
            {createForm.roleName.trim() && (
              <div style={{ marginTop: 4, marginBottom: 4 }}>
                <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 8, color: 'var(--text)' }}>
                  Access Permissions
                  <span style={{ fontWeight: 400, fontSize: 12, color: 'var(--text-muted)', marginLeft: 8 }}>
                    — select what this user can access
                  </span>
                </div>
                <PermissionGrid
                  selected={createForm.permissions}
                  onChange={perms => setCreateForm(f => ({ ...f, permissions: perms }))}
                />
                <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 6 }}>
                  {createForm.permissions.length} permission{createForm.permissions.length !== 1 ? 's' : ''} selected
                </div>
              </div>
            )}

            {/* Row: password + confirm */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginTop: 4 }}>
              <PwInput label="Password *" name="password" value={createForm.password} onChange={e => setCreateForm(f => ({ ...f, password: e.target.value }))} />
              <PwInput label="Confirm Password *" name="confirm" value={createForm.confirm} onChange={e => setCreateForm(f => ({ ...f, confirm: e.target.value }))} />
            </div>

            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 16 }}>
              <button type="button" className="btn btn-outline" onClick={() => setShowCreate(false)}>Cancel</button>
              <button type="submit" className="btn btn-primary" disabled={saving}>{saving ? 'Creating…' : 'Create User'}</button>
            </div>
          </form>
        </Modal>
      )}

      {/* ── Set Password Modal ── */}
      {pwModal && (
        <Modal title="Set Password" onClose={() => setPwModal(null)}>
          <p style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 16 }}>
            Setting password for <strong>{pwModal.username}</strong>
          </p>
          <form onSubmit={handleSetPassword}>
            <PwInput label="New Password *" name="password" value={pwForm.password} onChange={e => setPwForm(f => ({ ...f, password: e.target.value }))} />
            <PwInput label="Confirm Password *" name="confirm" value={pwForm.confirm} onChange={e => setPwForm(f => ({ ...f, confirm: e.target.value }))} />
            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 16 }}>
              <button type="button" className="btn btn-outline" onClick={() => setPwModal(null)}>Cancel</button>
              <button type="submit" className="btn btn-primary" disabled={saving}>{saving ? 'Saving…' : 'Update Password'}</button>
            </div>
          </form>
        </Modal>
      )}

      {/* ── Change Role Modal ── */}
      {roleModal && (
        <Modal title="Change Role" onClose={() => setRoleModal(null)}>
          <p style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 16 }}>
            Changing role for <strong>{roleModal.username}</strong>
          </p>
          <form onSubmit={handleChangeRole}>
            <div className="form-group">
              <label className="form-label">New Role</label>
              <select className="form-control" value={newRole} onChange={e => setNewRole(e.target.value)}>
                {ROLES.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
              </select>
            </div>
            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 16 }}>
              <button type="button" className="btn btn-outline" onClick={() => setRoleModal(null)}>Cancel</button>
              <button type="submit" className="btn btn-primary" disabled={saving}>{saving ? 'Saving…' : 'Update Role'}</button>
            </div>
          </form>
        </Modal>
      )}

      {/* ── Manage Permissions Modal ── */}
      {permModal && (
        <Modal title={`Permissions — ${permModal.user.username}`} onClose={() => setPermModal(null)} wide>
          <p style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 14 }}>
            Check the features this user can access. Each box is a priority tier.
          </p>
          <PermissionGrid
            selected={permModal.permissions}
            onChange={perms => setPermModal(m => ({ ...m, permissions: perms }))}
          />
          <div style={{ marginTop: 10, fontSize: 12, color: 'var(--text-muted)' }}>
            {permModal.permissions.length} permission{permModal.permissions.length !== 1 ? 's' : ''} selected
          </div>
          <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 16 }}>
            <button className="btn btn-outline" onClick={() => setPermModal(null)}>Cancel</button>
            <button className="btn btn-primary" disabled={saving} onClick={handleSavePermissions}>
              {saving ? 'Saving…' : 'Save Permissions'}
            </button>
          </div>
        </Modal>
      )}
    </div>
  )
}
