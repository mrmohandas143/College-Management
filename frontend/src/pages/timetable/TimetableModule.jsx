import { useState, useEffect } from 'react'
import api from '../../api/axios'
import { COURSES, DEPARTMENTS, COURSE_DEPARTMENTS } from '../../utils/constants'

const DAYS = ['monday','tuesday','wednesday','thursday','friday','saturday']
const DAY_SHORT = { monday:'Mon', tuesday:'Tue', wednesday:'Wed', thursday:'Thu', friday:'Fri', saturday:'Sat' }

export default function TimetableModule() {
  const [entries, setEntries]         = useState([])
  const [courses, setCourses]         = useState([])
  const [filterCourse, setFilterCourse] = useState('')
  const [filterSem, setFilterSem]     = useState('')
  const [showForm, setShowForm]       = useState(false)
  const [form, setForm]               = useState({ course: '', department: '', semester: 1, day: 'monday', period: 1, start_time: '', end_time: '', subject: '', subject_code: '', faculty_name: '', room: '', academic_year: '' })
  const [subjects, setSubjects]       = useState([])
  const [faculty, setFaculty]         = useState([])

  const load = async () => {
    const params = {}
    if (filterCourse) params.course = filterCourse
    if (filterSem)    params.semester = filterSem
    const [res, subRes, facRes] = await Promise.all([
      api.get('/timetable/', { params }),
      api.get('/academics/subjects/'),
      api.get('/faculty/'),
    ])
    const list = res.data.results ?? res.data
    setEntries(list)
    setCourses([...new Set(list.map(e => e.course))].filter(Boolean))
    setSubjects(subRes.data.results ?? subRes.data)
    setFaculty(facRes.data.results ?? facRes.data)
  }

  useEffect(() => { load() }, [filterCourse, filterSem])

  const set = e => {
    const { name, value } = e.target
    setForm(f => {
      const updated = { ...f, [name]: value }
      if (name === 'course') {
        updated.department = ''
        updated.subject = ''
        updated.subject_code = ''
      } else if (name === 'department' || name === 'semester') {
        updated.subject = ''
        updated.subject_code = ''
      }
      return updated
    })
  }

  const save = async (e) => {
    e.preventDefault()
    await api.post('/timetable/', form)
    setShowForm(false)
    setForm({ course: '', department: '', semester: 1, day: 'monday', period: 1, start_time: '', end_time: '', subject: '', subject_code: '', faculty_name: '', room: '', academic_year: '' })
    load()
  }

  const del = async (id) => {
    if (!confirm('Delete entry?')) return
    await api.delete(`/timetable/${id}/`)
    load()
  }

  const byDay = {}
  DAYS.forEach(d => { byDay[d] = entries.filter(e => e.day === d).sort((a, b) => a.period - b.period) })

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <div className="page-header" style={{ marginBottom: 0 }}>
        <div><h1>Timetable Module</h1><p>Class schedules and period management</p></div>
        <button className="btn btn-primary" onClick={() => setShowForm(s => !s)}>+ Add Entry</button>
      </div>

      {showForm && (
        <div className="form-panel">
          <div className="form-panel-title">Add Timetable Entry</div>
          <form onSubmit={save}>
            <div className="form-grid">
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
                <label className="form-label">Subject</label>
                <select name="subject" value={form.subject || ''} onChange={e => {
                  const val = e.target.value
                  const matched = subjects.find(sub => sub.name === val)
                  setForm(f => ({
                    ...f,
                    subject: val,
                    subject_code: matched ? matched.code : ''
                  }))
                }} required>
                  <option value="">Select Subject</option>
                  {subjects.filter(sub => (!form.course || sub.course === form.course) && (!form.department || sub.department === form.department) && (!form.semester || sub.semester === Number(form.semester))).map(sub => (
                    <option key={sub.id} value={sub.name}>{sub.name} ({sub.code})</option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Subject Code</label>
                <input name="subject_code" value={form.subject_code || ''} onChange={set} />
              </div>
              <div className="form-group">
                <label className="form-label">Faculty</label>
                <select name="faculty_name" value={form.faculty_name || ''} onChange={set}>
                  <option value="">Select Faculty</option>
                  {faculty.map(f => {
                    const name = `${f.first_name} ${f.last_name}`
                    return <option key={f.id} value={name}>{name} ({f.department})</option>
                  })}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Room</label>
                <input name="room" value={form.room || ''} onChange={set} />
              </div>
              <div className="form-group">
                <label className="form-label">Academic Year</label>
                <select name="academic_year" value={form.academic_year || ''} onChange={set}>
                  <option value="">Select Year</option>
                  {['2024-25', '2025-26', '2026-27'].map(y => <option key={y} value={y}>{y}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Day</label>
                <select name="day" value={form.day} onChange={set}>
                  {DAYS.map(d => <option key={d} value={d}>{d.charAt(0).toUpperCase() + d.slice(1)}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Period</label>
                <select name="period" value={form.period} onChange={set}>
                  {[1,2,3,4,5,6,7,8].map(p => <option key={p} value={p}>Period {p}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Semester</label>
                <select name="semester" value={form.semester} onChange={set}>
                  {[1,2,3,4,5,6,7,8].map(s => <option key={s} value={s}>Semester {s}</option>)}
                </select>
              </div>
              <div className="form-group"><label className="form-label">Start Time</label><input type="time" name="start_time" value={form.start_time} onChange={set} required /></div>
              <div className="form-group"><label className="form-label">End Time</label><input type="time" name="end_time" value={form.end_time} onChange={set} required /></div>
            </div>
            <div className="form-actions">
              <button className="btn btn-primary" type="submit">Save Entry</button>
              <button className="btn btn-outline" type="button" onClick={() => setShowForm(false)}>Cancel</button>
            </div>
          </form>
        </div>
      )}

      <div className="card">
        <div className="card-header">
          <h3>Weekly Schedule</h3>
          <div style={{ display: 'flex', gap: 8 }}>
            <select value={filterCourse} onChange={e => setFilterCourse(e.target.value)} style={{ width: 160 }}>
              <option value="">All Courses</option>
              {courses.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
            <select value={filterSem} onChange={e => setFilterSem(e.target.value)} style={{ width: 120 }}>
              <option value="">All Sems</option>
              {[1,2,3,4,5,6,7,8].map(s => <option key={s} value={s}>Sem {s}</option>)}
            </select>
          </div>
        </div>
        <div className="card-body" style={{ padding: 0 }}>
          {entries.length === 0
            ? <div className="empty-state"><p>No timetable entries yet</p><span>Add entries using the button above</span></div>
            : (
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 700 }}>
                  <thead>
                    <tr>
                      <th style={{ padding: '10px 14px', background: 'var(--bg)', fontWeight: 700, textAlign: 'left', borderBottom: '2px solid var(--border)', width: 80 }}>Day</th>
                      {[1,2,3,4,5,6,7,8].map(p => (
                        <th key={p} style={{ padding: '10px 8px', background: 'var(--bg)', fontWeight: 600, textAlign: 'center', borderBottom: '2px solid var(--border)', fontSize: 12, color: 'var(--text-muted)' }}>P{p}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {DAYS.map(day => (
                      <tr key={day} style={{ borderBottom: '1px solid var(--border)' }}>
                        <td style={{ padding: '8px 14px', fontWeight: 700, background: 'var(--bg)', fontSize: 13, color: 'var(--text-muted)' }}>{DAY_SHORT[day]}</td>
                        {[1,2,3,4,5,6,7,8].map(p => {
                          const entry = byDay[day]?.find(e => e.period === p)
                          return (
                            <td key={p} style={{ padding: 4, verticalAlign: 'top', minWidth: 90 }}>
                              {entry ? (
                                <div className="tt-cell">
                                  <button className="tt-del" onClick={() => del(entry.id)}>✕</button>
                                  <div className="tt-cell-subject">{entry.subject}</div>
                                  <div className="tt-cell-meta">{entry.faculty_name}</div>
                                  <div className="tt-cell-meta">{entry.start_time?.slice(0,5)}–{entry.end_time?.slice(0,5)}</div>
                                  {entry.room && <div className="tt-cell-meta">🚪 {entry.room}</div>}
                                </div>
                              ) : (
                                <div style={{ height: 60, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--border)', fontSize: 18 }}>·</div>
                              )}
                            </td>
                          )
                        })}
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
