import { useState, useEffect } from 'react'
import api from '../../api/axios'

const TYPE_COLOR = { info: '#2563eb', warning: '#f59e0b', success: '#22c55e', alert: '#ef4444' }
const TYPE_ICON  = { info: 'ℹ️', warning: '⚠️', success: '✅', alert: '🚨' }

export default function NotificationsModule() {
  const [notifications, setNotifications] = useState([])
  const [showForm, setShowForm]           = useState(false)
  const [form, setForm]                   = useState({ title: '', message: '', notif_type: 'info', target: 'all', expires_at: '' })
  const [loading, setLoading]             = useState(true)

  const load = async () => {
    setLoading(true)
    const res = await api.get('/notifications/')
    setNotifications(res.data.results ?? res.data)
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  const set = e => setForm(f => ({ ...f, [e.target.name]: e.target.value }))

  const save = async (e) => {
    e.preventDefault()
    await api.post('/notifications/', form)
    setShowForm(false)
    setForm({ title: '', message: '', notif_type: 'info', target: 'all', expires_at: '' })
    load()
  }

  const toggle = async (id, current) => {
    await api.patch(`/notifications/${id}/`, { is_active: !current })
    load()
  }

  const del = async (id) => {
    if (!confirm('Delete notification?')) return
    await api.delete(`/notifications/${id}/`)
    load()
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <div className="page-header" style={{ marginBottom: 0 }}>
        <div><h1>Notifications</h1><p>Broadcast announcements to users</p></div>
        <button className="btn btn-primary" onClick={() => setShowForm(s => !s)}>+ New Notification</button>
      </div>

      {showForm && (
        <div className="form-panel">
          <div className="form-panel-title">Create Notification</div>
          <form onSubmit={save}>
            <div className="form-grid">
              <div className="form-group"><label className="form-label">Title</label><input name="title" value={form.title} onChange={set} required /></div>
              <div className="form-group">
                <label className="form-label">Type</label>
                <select name="notif_type" value={form.notif_type} onChange={set}>
                  <option value="info">Info</option><option value="warning">Warning</option>
                  <option value="success">Success</option><option value="alert">Alert</option>
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Target Audience</label>
                <select name="target" value={form.target} onChange={set}>
                  <option value="all">All</option><option value="students">Students</option>
                  <option value="faculty">Faculty</option><option value="staff">Staff</option><option value="parents">Parents</option>
                </select>
              </div>
              <div className="form-group"><label className="form-label">Expires At (optional)</label><input type="datetime-local" name="expires_at" value={form.expires_at} onChange={set} /></div>
            </div>
            <div className="form-group"><label className="form-label">Message</label><textarea name="message" value={form.message} onChange={set} rows={3} required /></div>
            <div className="form-actions">
              <button className="btn btn-primary" type="submit">Send Notification</button>
              <button className="btn btn-outline" type="button" onClick={() => setShowForm(false)}>Cancel</button>
            </div>
          </form>
        </div>
      )}

      {loading
        ? <div className="loader-wrap"><div className="spinner" /></div>
        : notifications.length === 0
          ? <div className="card"><div className="empty-state"><p>No notifications yet</p><span>Create one using the button above</span></div></div>
          : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {notifications.map(n => {
                const color = TYPE_COLOR[n.notif_type] || '#666'
                return (
                  <div key={n.id} className="notif-card" style={{ borderLeft: `3px solid ${color}`, opacity: n.is_active ? 1 : 0.55 }}>
                    <div style={{ fontSize: 22, flexShrink: 0 }}>{TYPE_ICON[n.notif_type] || '📢'}</div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginBottom: 4 }}>
                        <span style={{ fontWeight: 700, fontSize: 14 }}>{n.title}</span>
                        <span style={{ padding: '2px 9px', borderRadius: 999, fontSize: 11, fontWeight: 600, background: color + '18', color }}>{n.notif_type}</span>
                        <span className="badge badge-gray">→ {n.target}</span>
                        {!n.is_active && <span className="badge badge-danger">Inactive</span>}
                      </div>
                      <p style={{ margin: 0, fontSize: 13, color: 'var(--text-muted)', lineHeight: 1.5 }}>{n.message}</p>
                      <div style={{ fontSize: 11, color: 'var(--text-light)', marginTop: 5 }}>
                        By {n.created_by || 'Admin'} · {new Date(n.created_at).toLocaleString('en-IN')}
                        {n.expires_at && ` · Expires: ${new Date(n.expires_at).toLocaleDateString('en-IN')}`}
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
                      <button className="btn btn-sm btn-outline" onClick={() => toggle(n.id, n.is_active)}>{n.is_active ? 'Deactivate' : 'Activate'}</button>
                      <button className="btn btn-sm btn-danger" onClick={() => del(n.id)}>Delete</button>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
    </div>
  )
}
