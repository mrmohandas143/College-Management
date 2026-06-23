import { useEffect, useState } from 'react'
import api from '../../api/axios'
import Loader from '../../components/Loader'

const TYPE_BADGE = {
  due_reminder: 'badge-warning',
  overdue: 'badge-danger',
  payment_confirm: 'badge-success',
  general: 'badge-info',
}
const TYPE_LABEL = {
  due_reminder: '⏰ Due Reminder',
  overdue: '🚨 Overdue Alert',
  payment_confirm: '✅ Payment Confirm',
  general: '📢 General',
}

export default function Notifications() {
  const [list, setList] = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('')
  // Bulk send
  const [bulkTitle, setBulkTitle] = useState('')
  const [bulkMessage, setBulkMessage] = useState('')
  const [bulkTarget, setBulkTarget] = useState('all')
  const [sending, setSending] = useState(false)
  const [sendResult, setSendResult] = useState(null)
  // Single
  const [showModal, setShowModal] = useState(false)
  const [form, setForm] = useState({ title: '', message: '', notification_type: 'general', student: '', send_to_all: false })
  const [students, setStudents] = useState([])
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const load = () => {
    setLoading(true)
    Promise.all([
      api.get('/fees/notifications/'),
      api.get('/students/'),
    ]).then(([n, s]) => {
      setList(n.data)
      setStudents(s.data)
    }).finally(() => setLoading(false))
  }
  useEffect(() => { load() }, [])

  const handleBulkSend = async () => {
    if (!bulkTitle || !bulkMessage) return
    setSending(true); setSendResult(null)
    try {
      const r = await api.post('/fees/bulk-notify/', { title: bulkTitle, message: bulkMessage, target: bulkTarget })
      setSendResult({ success: true, message: r.data.message })
      setBulkTitle(''); setBulkMessage('')
      load()
    } catch {
      setSendResult({ success: false, message: 'Failed to send notifications' })
    } finally { setSending(false) }
  }

  const handleSingle = async (e) => {
    e.preventDefault(); setSaving(true); setError('')
    try {
      const payload = { ...form, student: form.student || null }
      await api.post('/fees/notifications/', payload)
      setShowModal(false); load()
    } catch (err) {
      const d = err.response?.data
      setError(d ? Object.values(d).flat().join(' ') : 'Failed to send')
    } finally { setSaving(false) }
  }

  const handleDelete = async (id) => {
    if (!confirm('Delete this notification?')) return
    await api.delete(`/fees/notifications/${id}/`)
    load()
  }

  const markRead = async (item) => {
    await api.put(`/fees/notifications/${item.id}/`, { ...item, is_read: true })
    load()
  }

  const filtered = filter ? list.filter(n => n.notification_type === filter) : list
  const unread = list.filter(n => !n.is_read).length

  return (
    <div>
      <div className="page-header">
        <div>
          <h1>Notifications & Reminders</h1>
          <p>{list.length} total · <span style={{ color: '#f59e0b', fontWeight: 600 }}>{unread} unread</span></p>
        </div>
        <button onClick={() => { setForm({ title: '', message: '', notification_type: 'general', student: '', send_to_all: false }); setError(''); setShowModal(true) }}
          className="btn btn-primary">+ Send Notification</button>
      </div>

      {/* Bulk Send Panel */}
      <div className="card" style={{ marginBottom: 24 }}>
        <div className="card-header">
          <h3>📣 Bulk Fee Reminder</h3>
          <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>Send reminders to all / pending / overdue students</span>
        </div>
        <div className="card-body">
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 }}>
            <div className="form-group" style={{ margin: 0 }}>
              <label className="form-label">Title</label>
              <input value={bulkTitle} onChange={e => setBulkTitle(e.target.value)} placeholder="e.g. Fee Due Reminder" />
            </div>
            <div className="form-group" style={{ margin: 0 }}>
              <label className="form-label">Send To</label>
              <select value={bulkTarget} onChange={e => setBulkTarget(e.target.value)}>
                <option value="all">All Active Students</option>
                <option value="pending">Students with Pending Fees</option>
                <option value="overdue">Students with Overdue Fees</option>
              </select>
            </div>
          </div>
          <div className="form-group" style={{ marginBottom: 12 }}>
            <label className="form-label">Message</label>
            <textarea rows={2} value={bulkMessage} onChange={e => setBulkMessage(e.target.value)}
              placeholder="e.g. Your fee payment is due. Please pay before the due date to avoid penalties." />
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <button onClick={handleBulkSend} className="btn btn-primary"
              disabled={sending || !bulkTitle || !bulkMessage}>
              {sending ? 'Sending...' : '📣 Send Bulk Reminder'}
            </button>
            {sendResult && (
              <div className={`alert ${sendResult.success ? 'alert-success' : 'alert-error'}`} style={{ margin: 0, padding: '6px 12px' }}>
                {sendResult.message}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Notification List */}
      <div className="card">
        <div className="toolbar">
          <span style={{ fontWeight: 500 }}>All Notifications</span>
          <div style={{ display: 'flex', gap: 6 }}>
            {['', 'due_reminder', 'overdue', 'payment_confirm', 'general'].map(t => (
              <button key={t} onClick={() => setFilter(t)}
                className={`btn btn-sm ${filter === t ? 'btn-primary' : 'btn-outline'}`}>
                {t ? TYPE_LABEL[t] : 'All'}
              </button>
            ))}
          </div>
        </div>

        {loading ? <Loader /> : filtered.length === 0 ? (
          <div className="empty-state">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9 M13.73 21a2 2 0 01-3.46 0" /></svg>
            <p>No notifications found.</p>
          </div>
        ) : (
          <div className="table-wrap">
            <table>
              <thead>
                <tr><th>Title</th><th>Type</th><th>Student</th><th>Message</th><th>Date</th><th>Read</th><th>Actions</th></tr>
              </thead>
              <tbody>
                {filtered.map(n => (
                  <tr key={n.id} style={{ background: n.is_read ? 'transparent' : 'var(--primary-light)' }}>
                    <td style={{ fontWeight: n.is_read ? 400 : 700 }}>{n.title}</td>
                    <td><span className={`badge ${TYPE_BADGE[n.notification_type]}`}>{TYPE_LABEL[n.notification_type]}</span></td>
                    <td>{n.student_name || <span style={{ color: 'var(--text-muted)' }}>All</span>}</td>
                    <td style={{ maxWidth: 220, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', color: 'var(--text-muted)' }}>
                      {n.message}
                    </td>
                    <td style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                      {new Date(n.created_at).toLocaleDateString('en-IN')}
                    </td>
                    <td>
                      {n.is_read
                        ? <span className="badge badge-success">Read</span>
                        : <button onClick={() => markRead(n)} className="badge badge-warning" style={{ border: 'none', cursor: 'pointer' }}>Unread</button>
                      }
                    </td>
                    <td>
                      <button onClick={() => handleDelete(n.id)} className="btn btn-danger btn-sm">Delete</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Single Notification Modal */}
      {showModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: 16 }}>
          <div style={{ background: 'var(--bg-card)', borderRadius: 12, width: '100%', maxWidth: 480, boxShadow: '0 20px 60px rgba(0,0,0,0.2)', border: '1px solid var(--border)' }}>
            <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ fontWeight: 700, fontSize: 16 }}>Send Notification</div>
              <button onClick={() => setShowModal(false)} style={{ background: 'none', border: 'none', fontSize: 20, cursor: 'pointer', color: '#6b7280' }}>✕</button>
            </div>
            <form onSubmit={handleSingle} style={{ padding: 24 }}>
              {error && <div className="alert alert-error">{error}</div>}
              <div className="form-group">
                <label className="form-label">Title *</label>
                <input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} required />
              </div>
              <div className="form-grid">
                <div className="form-group">
                  <label className="form-label">Type</label>
                  <select value={form.notification_type} onChange={e => setForm(f => ({ ...f, notification_type: e.target.value }))}>
                    <option value="general">General</option>
                    <option value="due_reminder">Due Reminder</option>
                    <option value="overdue">Overdue Alert</option>
                    <option value="payment_confirm">Payment Confirmation</option>
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Student (optional)</label>
                  <select value={form.student} onChange={e => setForm(f => ({ ...f, student: e.target.value }))}>
                    <option value="">All Students</option>
                    {students.map(s => <option key={s.id} value={s.id}>{s.first_name} {s.last_name}</option>)}
                  </select>
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">Message *</label>
                <textarea rows={3} value={form.message} onChange={e => setForm(f => ({ ...f, message: e.target.value }))} required />
              </div>
              <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
                <button type="button" onClick={() => setShowModal(false)} className="btn btn-outline">Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={saving}>
                  {saving ? 'Sending...' : 'Send'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
