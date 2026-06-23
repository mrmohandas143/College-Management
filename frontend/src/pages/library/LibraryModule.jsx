import { useState, useEffect } from 'react'
import api from '../../api/axios'
import { ENDPOINTS } from '../../api/endpoints'

const BOOK_BADGE   = { available: 'badge-success', issued: 'badge-warning', lost: 'badge-danger' }
const ISSUE_BADGE  = { issued: 'badge-warning', returned: 'badge-success', overdue: 'badge-danger' }

export default function LibraryModule() {
  const [tab, setTab]               = useState('dashboard')
  const [books, setBooks]           = useState([])
  const [categories, setCategories] = useState([])
  const [issues, setIssues]         = useState([])
  const [stats, setStats]           = useState(null)
  const [loading, setLoading]       = useState(false)
  const [search, setSearch]         = useState('')
  const [showForm, setShowForm]     = useState(false)
  const [showIssueForm, setShowIssueForm] = useState(false)
  const [form, setForm]             = useState({ title: '', author: '', isbn: '', category: '', publisher: '', edition: '', total_copies: 1, available_copies: 1, rack_number: '' })
  const [issueForm, setIssueForm]   = useState({ book: '', member_name: '', member_type: 'student', member_id: '', issue_date: new Date().toISOString().split('T')[0], due_date: '' })
  const [students, setStudents]     = useState([])
  const [faculty, setFaculty]       = useState([])

  const load = async () => {
    setLoading(true)
    const [b, c, i, s, sRes, fRes] = await Promise.all([
      api.get(ENDPOINTS.LIBRARY_BOOKS, { params: search ? { search } : {} }),
      api.get(ENDPOINTS.LIBRARY_CATEGORIES),
      api.get(ENDPOINTS.LIBRARY_ISSUES, { params: { status: 'issued' } }),
      api.get(`${ENDPOINTS.LIBRARY_BOOKS}stats/`),
      api.get(ENDPOINTS.STUDENTS),
      api.get(ENDPOINTS.FACULTY),
    ])
    setBooks(b.data.results ?? b.data)
    setCategories(c.data.results ?? c.data)
    setIssues(i.data.results ?? i.data)
    setStats(s.data)
    setStudents(sRes.data.results ?? sRes.data)
    setFaculty(fRes.data.results ?? fRes.data)
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  const set  = e => setForm(f => ({ ...f, [e.target.name]: e.target.value }))
  const setI = e => {
    const { name, value } = e.target
    setIssueForm(f => {
      const updated = { ...f, [name]: value }
      if (name === 'member_type') {
        updated.member = ''
        updated.member_name = ''
        updated.member_id = ''
      }
      return updated
    })
  }

  const saveBook = async (e) => {
    e.preventDefault()
    await api.post(ENDPOINTS.LIBRARY_BOOKS, form)
    setShowForm(false)
    setForm({ title: '', author: '', isbn: '', category: '', publisher: '', edition: '', total_copies: 1, available_copies: 1, rack_number: '' })
    load()
  }

  const saveIssue = async (e) => {
    e.preventDefault()
    const { member, ...payload } = issueForm
    await api.post(ENDPOINTS.LIBRARY_ISSUES, payload)
    setShowIssueForm(false)
    setIssueForm({ book: '', member_name: '', member_type: 'student', member_id: '', issue_date: new Date().toISOString().split('T')[0], due_date: '' })
    load()
  }

  const returnBook = async (id) => {
    await api.post(`${ENDPOINTS.LIBRARY_ISSUES}${id}/return_book/`)
    load()
  }

  const deleteBook = async (id) => {
    if (!confirm('Delete this book?')) return
    await api.delete(`${ENDPOINTS.LIBRARY_BOOKS}${id}/`)
    load()
  }

  const KPI_DATA = stats ? [
    { label: 'Total Books',   value: stats.total_books,   color: '#2563eb', icon: '📚' },
    { label: 'Available',     value: stats.available,     color: '#22c55e', icon: '✅' },
    { label: 'Issued',        value: stats.issued,        color: '#f59e0b', icon: '📤' },
    { label: 'Total Issues',  value: stats.total_issues,  color: '#7c3aed', icon: '📋' },
    { label: 'Active Issues', value: stats.active_issues, color: '#0891b2', icon: '🔖' },
    { label: 'Overdue',       value: stats.overdue,       color: '#ef4444', icon: '⚠️' },
  ] : []

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <div className="page-header" style={{ marginBottom: 0 }}>
        <div><h1>Library Management</h1><p>Books, issues &amp; returns</p></div>
      </div>

      <div className="mod-tabs">
        {[['dashboard', '📊 Dashboard'], ['books', '📚 Books'], ['issues', '📤 Issues']].map(([t, label]) => (
          <button key={t} className={`mod-tab${tab === t ? ' active' : ''}`} onClick={() => setTab(t)}>{label}</button>
        ))}
      </div>

      {tab === 'dashboard' && stats && (
        <div className="kpi-grid">
          {KPI_DATA.map(k => (
            <div key={k.label} className="kpi-card" style={{ '--kpi-color': k.color }}>
              <div className="kpi-icon">{k.icon}</div>
              <div className="kpi-value">{k.value}</div>
              <div className="kpi-label">{k.label}</div>
            </div>
          ))}
        </div>
      )}

      {tab === 'books' && (
        <div className="card">
          <div className="card-header">
            <h3>Book Catalog</h3>
            <button className="btn btn-primary btn-sm" onClick={() => setShowForm(s => !s)}>+ Add Book</button>
          </div>
          <div className="card-body">
            <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
              <div className="search-bar" style={{ flex: 1 }}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
                <input placeholder="Search title, author, ISBN…" value={search} onChange={e => setSearch(e.target.value)} onKeyDown={e => e.key === 'Enter' && load()} style={{ width: '100%' }} />
              </div>
              <button className="btn btn-outline" onClick={load}>Search</button>
            </div>

            {showForm && (
              <div className="form-panel">
                <div className="form-panel-title">Add New Book</div>
                <form onSubmit={saveBook}>
                  <div className="form-grid">
                    {[['Title','title'],['Author','author'],['ISBN','isbn'],['Publisher','publisher'],['Edition','edition'],['Rack No','rack_number']].map(([l, n]) => (
                      <div key={n} className="form-group"><label className="form-label">{l}</label><input name={n} value={form[n]} onChange={set} /></div>
                    ))}
                    <div className="form-group">
                      <label className="form-label">Category</label>
                      <select name="category" value={form.category} onChange={set}>
                        <option value="">Select category</option>
                        {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                      </select>
                    </div>
                    <div className="form-group"><label className="form-label">Total Copies</label><input type="number" name="total_copies" value={form.total_copies} onChange={set} /></div>
                    <div className="form-group"><label className="form-label">Available Copies</label><input type="number" name="available_copies" value={form.available_copies} onChange={set} /></div>
                  </div>
                  <div className="form-actions">
                    <button className="btn btn-primary" type="submit">Save Book</button>
                    <button className="btn btn-outline" type="button" onClick={() => setShowForm(false)}>Cancel</button>
                  </div>
                </form>
              </div>
            )}

            {loading ? <div className="loader-wrap"><div className="spinner" /></div> : (
              <div className="table-wrap">
                <table>
                  <thead><tr><th>Title</th><th>Author</th><th>Category</th><th>Copies</th><th>Available</th><th>Rack</th><th>Status</th><th></th></tr></thead>
                  <tbody>
                    {books.length === 0
                      ? <tr><td colSpan={8} style={{ textAlign: 'center', color: 'var(--text-muted)', padding: 32 }}>No books found</td></tr>
                      : books.map(b => (
                        <tr key={b.id}>
                          <td style={{ fontWeight: 600 }}>{b.title}</td>
                          <td>{b.author}</td>
                          <td>{b.category_name || '—'}</td>
                          <td>{b.total_copies}</td>
                          <td><strong style={{ color: b.available_copies > 0 ? '#22c55e' : '#ef4444' }}>{b.available_copies}</strong></td>
                          <td>{b.rack_number || '—'}</td>
                          <td><span className={`badge ${BOOK_BADGE[b.status] || 'badge-gray'}`}>{b.status}</span></td>
                          <td><button className="btn btn-sm btn-danger" onClick={() => deleteBook(b.id)}>Delete</button></td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {tab === 'issues' && (
        <div className="card">
          <div className="card-header">
            <h3>Active Issues</h3>
            <button className="btn btn-primary btn-sm" onClick={() => setShowIssueForm(s => !s)}>+ Issue Book</button>
          </div>
          <div className="card-body">
            {showIssueForm && (
              <div className="form-panel">
                <div className="form-panel-title">Issue a Book</div>
                <form onSubmit={saveIssue}>
                  <div className="form-grid">
                    <div className="form-group">
                      <label className="form-label">Book</label>
                      <select name="book" value={issueForm.book} onChange={setI} required>
                        <option value="">Select book</option>
                        {books.filter(b => b.available_copies > 0).map(b => <option key={b.id} value={b.id}>{b.title}</option>)}
                      </select>
                    </div>
                    <div className="form-group">
                      <label className="form-label">Member Type</label>
                      <select name="member_type" value={issueForm.member_type} onChange={setI}>
                        <option value="student">Student</option><option value="faculty">Faculty</option><option value="staff">Staff</option>
                      </select>
                    </div>
                    {['student', 'faculty'].includes(issueForm.member_type) ? (
                      <div className="form-group">
                        <label className="form-label">Select Member</label>
                        <select name="member" value={issueForm.member || ''} onChange={e => {
                          const val = Number(e.target.value)
                          if (issueForm.member_type === 'student') {
                            const st = students.find(s => s.id === val)
                            if (st) {
                              setIssueForm(f => ({ ...f, member: st.id, member_name: `${st.first_name} ${st.last_name}`, member_id: st.register_number }))
                            } else {
                              setIssueForm(f => ({ ...f, member: '', member_name: '', member_id: '' }))
                            }
                          } else {
                            const fac = faculty.find(f => f.id === val)
                            if (fac) {
                              setIssueForm(f => ({ ...f, member: fac.id, member_name: `${fac.first_name} ${fac.last_name}`, member_id: String(fac.id) }))
                            } else {
                              setIssueForm(f => ({ ...f, member: '', member_name: '', member_id: '' }))
                            }
                          }
                        }} required>
                          <option value="">Select member</option>
                          {issueForm.member_type === 'student'
                            ? students.map(s => <option key={s.id} value={s.id}>{s.first_name} {s.last_name} ({s.register_number})</option>)
                            : faculty.map(f => <option key={f.id} value={f.id}>{f.first_name} {f.last_name} ({f.department})</option>)
                          }
                        </select>
                      </div>
                    ) : null}
                    <div className="form-group">
                      <label className="form-label">Member Name</label>
                      <input name="member_name" value={issueForm.member_name} readOnly={['student', 'faculty'].includes(issueForm.member_type)} style={{ background: ['student', 'faculty'].includes(issueForm.member_type) ? 'var(--bg)' : 'inherit' }} onChange={setI} required />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Member ID</label>
                      <input name="member_id" value={issueForm.member_id} readOnly={['student', 'faculty'].includes(issueForm.member_type)} style={{ background: ['student', 'faculty'].includes(issueForm.member_type) ? 'var(--bg)' : 'inherit' }} onChange={setI} />
                    </div>
                    <div className="form-group"><label className="form-label">Issue Date</label><input type="date" name="issue_date" value={issueForm.issue_date} onChange={setI} required /></div>
                    <div className="form-group"><label className="form-label">Due Date</label><input type="date" name="due_date" value={issueForm.due_date} onChange={setI} required /></div>
                  </div>
                  <div className="form-actions">
                    <button className="btn btn-primary" type="submit">Issue Book</button>
                    <button className="btn btn-outline" type="button" onClick={() => setShowIssueForm(false)}>Cancel</button>
                  </div>
                </form>
              </div>
            )}
            <div className="table-wrap">
              <table>
                <thead><tr><th>Book</th><th>Member</th><th>Type</th><th>Issue Date</th><th>Due Date</th><th>Status</th><th>Fine</th><th></th></tr></thead>
                <tbody>
                  {issues.length === 0
                    ? <tr><td colSpan={8} style={{ textAlign: 'center', color: 'var(--text-muted)', padding: 32 }}>No active issues</td></tr>
                    : issues.map(i => (
                      <tr key={i.id}>
                        <td style={{ fontWeight: 600 }}>{i.book_title}</td>
                        <td>{i.member_name}</td>
                        <td><span className="badge badge-gray">{i.member_type}</span></td>
                        <td>{i.issue_date}</td>
                        <td style={{ color: i.status === 'overdue' ? '#ef4444' : 'inherit', fontWeight: i.status === 'overdue' ? 600 : 400 }}>{i.due_date}</td>
                        <td><span className={`badge ${ISSUE_BADGE[i.status] || 'badge-gray'}`}>{i.status}</span></td>
                        <td>{i.fine_amount > 0 ? <strong style={{ color: '#ef4444' }}>₹{i.fine_amount}</strong> : '—'}</td>
                        <td>{i.status === 'issued' && <button className="btn btn-sm btn-success" onClick={() => returnBook(i.id)}>Return</button>}</td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
