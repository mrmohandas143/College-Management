import { useState, useEffect } from 'react'
import api from '../../api/axios'
import { COURSES, DEPARTMENTS, COURSE_DEPARTMENTS } from '../../utils/constants'

const EVENT_COLORS = { holiday: '#ef4444', exam: '#f59e0b', event: '#2563eb', semester_start: '#22c55e', semester_end: '#7c3aed' }
const TYPE_BADGE = { theory: 'badge-info', practical: 'badge-warning', elective: 'badge-purple' }

export default function AcademicsModule() {
  const [tab, setTab]           = useState('subjects')
  const [subjects, setSubjects] = useState([])
  const [calendar, setCalendar] = useState([])
  const [showForm, setShowForm] = useState(null)
  const [form, setForm]         = useState({})

  const load = async () => {
    const [s, c] = await Promise.all([api.get('/academics/subjects/'), api.get('/academics/calendar/')])
    setSubjects(s.data.results ?? s.data)
    setCalendar(c.data.results ?? c.data)
  }

  useEffect(() => { load() }, [])

  const set = e => {
    const { name, value } = e.target
    setForm(f => {
      const updated = { ...f, [name]: value }
      if (name === 'course') {
        updated.department = ''
      }
      return updated
    })
  }

  const save = async (endpoint, e) => {
    e.preventDefault()
    await api.post(endpoint, form)
    setShowForm(null); setForm({}); load()
  }

  const del = async (endpoint, id) => {
    if (!confirm('Delete?')) return
    await api.delete(`${endpoint}${id}/`)
    load()
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <div className="page-header" style={{ marginBottom: 0 }}>
        <div>
          <h1>Academic Module</h1>
          <p>Subjects, curriculum &amp; academic calendar</p>
        </div>
      </div>

      <div className="mod-tabs">
        {[['subjects', '📚 Subjects'], ['calendar', '📅 Academic Calendar']].map(([t, label]) => (
          <button key={t} className={`mod-tab${tab === t ? ' active' : ''}`} onClick={() => setTab(t)}>{label}</button>
        ))}
      </div>

      {tab === 'subjects' && (
        <div className="card">
          <div className="card-header">
            <h3>Subjects</h3>
            <button className="btn btn-primary btn-sm" onClick={() => { setShowForm('subject'); setForm({ name: '', code: '', course: '', department: '', semester: 1, credits: 3, subject_type: 'theory', faculty_name: '' }) }}>+ Add Subject</button>
          </div>
          <div className="card-body">
            {showForm === 'subject' && (
              <div className="form-panel">
                <div className="form-panel-title">New Subject</div>
                <form onSubmit={e => save('/academics/subjects/', e)}>
                  <div className="form-grid">
                    {[['Subject Name', 'name'], ['Code', 'code']].map(([l, n]) => (
                      <div key={n} className="form-group">
                        <label className="form-label">{l}</label>
                        <input name={n} value={form[n] || ''} onChange={set} required />
                      </div>
                    ))}
                    <div className="form-group">
                      <label className="form-label">Course</label>
                      <select name="course" value={form.course || ''} onChange={set} required>
                        <option value="">Select Course</option>
                        {COURSES.map(c => <option key={c} value={c}>{c}</option>)}
                      </select>
                    </div>
                    <div className="form-group">
                      <label className="form-label">Department</label>
                      <select name="department" value={form.department || ''} onChange={set}>
                        <option value="">Select Department</option>
                        {(COURSE_DEPARTMENTS[form.course] || []).map(d => <option key={d} value={d}>{d}</option>)}
                      </select>
                    </div>
                    <div className="form-group">
                      <label className="form-label">Faculty</label>
                      <input name="faculty_name" value={form.faculty_name || ''} onChange={set} />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Semester</label>
                      <select name="semester" value={form.semester || 1} onChange={set}>
                        {[1,2,3,4,5,6,7,8].map(s => <option key={s} value={s}>Semester {s}</option>)}
                      </select>
                    </div>
                    <div className="form-group"><label className="form-label">Credits</label><input type="number" name="credits" value={form.credits || 3} onChange={set} /></div>
                    <div className="form-group">
                      <label className="form-label">Type</label>
                      <select name="subject_type" value={form.subject_type || 'theory'} onChange={set}>
                        <option value="theory">Theory</option><option value="practical">Practical</option><option value="elective">Elective</option>
                      </select>
                    </div>
                  </div>
                  <div className="form-actions">
                    <button className="btn btn-primary" type="submit">Save Subject</button>
                    <button className="btn btn-outline" type="button" onClick={() => setShowForm(null)}>Cancel</button>
                  </div>
                </form>
              </div>
            )}
            <div className="table-wrap">
              <table>
                <thead><tr><th>Code</th><th>Subject</th><th>Course</th><th>Semester</th><th>Credits</th><th>Type</th><th>Faculty</th><th></th></tr></thead>
                <tbody>
                  {subjects.length === 0
                    ? <tr><td colSpan={8} style={{ textAlign: 'center', color: 'var(--text-muted)', padding: 32 }}>No subjects added yet</td></tr>
                    : subjects.map(s => (
                      <tr key={s.id}>
                        <td><code style={{ background: 'var(--bg)', padding: '2px 8px', borderRadius: 4, fontSize: 12 }}>{s.code}</code></td>
                        <td style={{ fontWeight: 600 }}>{s.name}</td>
                        <td>{s.course}</td>
                        <td>Sem {s.semester}</td>
                        <td>{s.credits}</td>
                        <td><span className={`badge ${TYPE_BADGE[s.subject_type] || 'badge-gray'}`}>{s.subject_type}</span></td>
                        <td>{s.faculty_name || <span style={{ color: 'var(--text-muted)' }}>—</span>}</td>
                        <td><button className="btn btn-sm btn-danger" onClick={() => del('/academics/subjects/', s.id)}>Delete</button></td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {tab === 'calendar' && (
        <div className="card">
          <div className="card-header">
            <h3>Academic Calendar</h3>
            <button className="btn btn-primary btn-sm" onClick={() => { setShowForm('event'); setForm({ title: '', event_type: 'event', start_date: '', end_date: '', description: '', academic_year: '' }) }}>+ Add Event</button>
          </div>
          <div className="card-body">
            {showForm === 'event' && (
              <div className="form-panel">
                <div className="form-panel-title">New Calendar Event</div>
                <form onSubmit={e => save('/academics/calendar/', e)}>
                  <div className="form-grid">
                    <div className="form-group"><label className="form-label">Title</label><input name="title" value={form.title || ''} onChange={set} required /></div>
                    <div className="form-group">
                      <label className="form-label">Type</label>
                      <select name="event_type" value={form.event_type || 'event'} onChange={set}>
                        <option value="holiday">Holiday</option><option value="exam">Exam</option><option value="event">Event</option>
                        <option value="semester_start">Semester Start</option><option value="semester_end">Semester End</option>
                      </select>
                    </div>
                    <div className="form-group"><label className="form-label">Start Date</label><input type="date" name="start_date" value={form.start_date || ''} onChange={set} required /></div>
                    <div className="form-group"><label className="form-label">End Date</label><input type="date" name="end_date" value={form.end_date || ''} onChange={set} /></div>
                    <div className="form-group">
                      <label className="form-label">Academic Year</label>
                      <select name="academic_year" value={form.academic_year || ''} onChange={set}>
                        <option value="">Select Year</option>
                        {['2024-25', '2025-26', '2026-27'].map(y => <option key={y} value={y}>{y}</option>)}
                      </select>
                    </div>
                  </div>
                  <div className="form-group"><label className="form-label">Description</label><textarea name="description" value={form.description || ''} onChange={set} rows={2} /></div>
                  <div className="form-actions">
                    <button className="btn btn-primary" type="submit">Save Event</button>
                    <button className="btn btn-outline" type="button" onClick={() => setShowForm(null)}>Cancel</button>
                  </div>
                </form>
              </div>
            )}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {calendar.length === 0
                ? <div className="empty-state"><p>No events scheduled</p></div>
                : calendar.map(e => {
                  const color = EVENT_COLORS[e.event_type] || '#666'
                  return (
                    <div key={e.id} className="event-item" style={{ borderLeft: `3px solid ${color}` }}>
                      <div className="event-dot" style={{ background: color }} />
                      <div style={{ flex: 1 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                          <span style={{ fontWeight: 600, fontSize: 14 }}>{e.title}</span>
                          <span style={{ padding: '2px 10px', borderRadius: 999, fontSize: 11, fontWeight: 600, background: color + '18', color }}>{e.event_type.replace('_', ' ')}</span>
                          {e.academic_year && <span className="badge badge-gray">{e.academic_year}</span>}
                        </div>
                        <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 3 }}>
                          {e.start_date}{e.end_date && e.end_date !== e.start_date ? ` → ${e.end_date}` : ''}
                          {e.description && ` · ${e.description}`}
                        </div>
                      </div>
                      <button className="btn btn-sm btn-danger" onClick={() => del('/academics/calendar/', e.id)}>Delete</button>
                    </div>
                  )
                })}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
