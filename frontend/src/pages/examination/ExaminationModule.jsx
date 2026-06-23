import { useState, useEffect } from 'react'
import api from '../../api/axios'
import { getStudents } from '../../services/studentService'
import { COURSES, DEPARTMENTS, COURSE_DEPARTMENTS } from '../../utils/constants'

const GRADE_COLOR = { O: '#22c55e', 'A+': '#16a34a', A: '#2563eb', 'B+': '#7c3aed', B: '#0891b2', C: '#f59e0b', F: '#ef4444', AB: '#6b7280' }
const EXAM_BADGE  = { scheduled: 'badge-warning', ongoing: 'badge-info', completed: 'badge-success', cancelled: 'badge-danger' }

export default function ExaminationModule() {
  const [tab, setTab]           = useState('dashboard')
  const [exams, setExams]       = useState([])
  const [results, setResults]   = useState([])
  const [students, setStudents] = useState([])
  const [stats, setStats]       = useState(null)
  const [selectedExam, setSelectedExam] = useState(null)
  const [showForm, setShowForm] = useState(null)
  const [form, setForm]         = useState({})
  const [subjects, setSubjects] = useState([])

  const load = async () => {
    const [e, s, st, sub] = await Promise.all([
      api.get('/examination/exams/'),
      getStudents(),
      api.get('/examination/exams/stats/'),
      api.get('/academics/subjects/'),
    ])
    setExams(e.data.results ?? e.data)
    setStudents(s.data.results ?? s.data)
    setStats(st.data)
    setSubjects(sub.data.results ?? sub.data)
  }

  const loadResults = async (examId) => {
    const res = await api.get(`/examination/results/?exam=${examId}`)
    setResults(res.data.results ?? res.data)
    setSelectedExam(examId)
    setTab('results')
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

  const updateStatus = async (id, status) => {
    await api.patch(`/examination/exams/${id}/`, { status })
    load()
  }

  const KPI_DATA = stats ? [
    { label: 'Total Exams',   value: stats.total_exams,   color: '#2563eb', icon: '📝' },
    { label: 'Scheduled',     value: stats.scheduled,     color: '#f59e0b', icon: '📅' },
    { label: 'Completed',     value: stats.completed,     color: '#22c55e', icon: '✅' },
    { label: 'Total Results', value: stats.total_results, color: '#7c3aed', icon: '📊' },
    { label: 'Passed',        value: stats.pass_count,    color: '#059669', icon: '🎉' },
    { label: 'Failed',        value: stats.fail_count,    color: '#ef4444', icon: '❌' },
  ] : []

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <div className="page-header" style={{ marginBottom: 0 }}>
        <div><h1>Examination Module</h1><p>Exams, results &amp; grade management</p></div>
      </div>

      <div className="mod-tabs">
        {[['dashboard','📊 Dashboard'],['exams','📝 Exams'],['results','📋 Results']].map(([t, label]) => (
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

      {tab === 'exams' && (
        <div className="card">
          <div className="card-header">
            <h3>Exam Schedule</h3>
            <button className="btn btn-primary btn-sm" onClick={() => { setShowForm('exam'); setForm({ name: '', exam_type: 'internal', course: '', department: '', semester: 1, subject: '', subject_code: '', exam_date: '', start_time: '', end_time: '', room: '', max_marks: 100, pass_marks: 40, status: 'scheduled', academic_year: '' }) }}>+ Schedule Exam</button>
          </div>
          <div className="card-body">
            {showForm === 'exam' && (
              <div className="form-panel">
                <div className="form-panel-title">Schedule New Exam</div>
                <form onSubmit={e => save('/examination/exams/', e)}>
                  <div className="form-grid">
                    <div className="form-group">
                      <label className="form-label">Exam Name</label>
                      <input name="name" value={form.name || ''} onChange={set} required />
                    </div>
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
                        {subjects.filter(sub => (!form.course || sub.course === form.course) && (!form.department || sub.department === form.department)).map(sub => (
                          <option key={sub.id} value={sub.name}>{sub.name} ({sub.code})</option>
                        ))}
                      </select>
                    </div>
                    <div className="form-group">
                      <label className="form-label">Subject Code</label>
                      <input name="subject_code" value={form.subject_code || ''} onChange={set} />
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
                      <label className="form-label">Type</label>
                      <select name="exam_type" value={form.exam_type || 'internal'} onChange={set}>
                        <option value="internal">Internal</option><option value="external">External</option>
                        <option value="practical">Practical</option><option value="viva">Viva</option>
                      </select>
                    </div>
                    <div className="form-group">
                      <label className="form-label">Semester</label>
                      <select name="semester" value={form.semester || 1} onChange={set}>
                        {[1,2,3,4,5,6,7,8].map(s => <option key={s} value={s}>Semester {s}</option>)}
                      </select>
                    </div>
                    <div className="form-group"><label className="form-label">Exam Date</label><input type="date" name="exam_date" value={form.exam_date || ''} onChange={set} required /></div>
                    <div className="form-group"><label className="form-label">Start Time</label><input type="time" name="start_time" value={form.start_time || ''} onChange={set} /></div>
                    <div className="form-group"><label className="form-label">End Time</label><input type="time" name="end_time" value={form.end_time || ''} onChange={set} /></div>
                    <div className="form-group"><label className="form-label">Max Marks</label><input type="number" name="max_marks" value={form.max_marks || 100} onChange={set} /></div>
                    <div className="form-group"><label className="form-label">Pass Marks</label><input type="number" name="pass_marks" value={form.pass_marks || 40} onChange={set} /></div>
                  </div>
                  <div className="form-actions">
                    <button className="btn btn-primary" type="submit">Save</button>
                    <button className="btn btn-outline" type="button" onClick={() => setShowForm(null)}>Cancel</button>
                  </div>
                </form>
              </div>
            )}
            <div className="table-wrap">
              <table>
                <thead><tr><th>Exam</th><th>Subject</th><th>Course</th><th>Date</th><th>Max</th><th>Pass</th><th>Status</th><th></th></tr></thead>
                <tbody>
                  {exams.length === 0
                    ? <tr><td colSpan={8} style={{ textAlign: 'center', color: 'var(--text-muted)', padding: 32 }}>No exams scheduled</td></tr>
                    : exams.map(e => (
                      <tr key={e.id}>
                        <td style={{ fontWeight: 600 }}>{e.name}</td>
                        <td>{e.subject}</td>
                        <td>{e.course}</td>
                        <td>{e.exam_date}</td>
                        <td>{e.max_marks}</td>
                        <td>{e.pass_marks}</td>
                        <td><span className={`badge ${EXAM_BADGE[e.status] || 'badge-gray'}`}>{e.status}</span></td>
                        <td>
                          <div style={{ display: 'flex', gap: 4 }}>
                            {e.status === 'scheduled' && <button className="btn btn-sm btn-outline" onClick={() => updateStatus(e.id, 'ongoing')}>Start</button>}
                            {e.status === 'ongoing'   && <button className="btn btn-sm btn-success" onClick={() => updateStatus(e.id, 'completed')}>Complete</button>}
                            <button className="btn btn-sm btn-outline" onClick={() => loadResults(e.id)}>Results</button>
                          </div>
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {tab === 'results' && (
        <div className="card">
          <div className="card-header">
            <div>
              <h3>Exam Results</h3>
              {selectedExam && <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>Exam #{selectedExam}</span>}
            </div>
            <button className="btn btn-primary btn-sm" onClick={() => { setShowForm('result'); setForm({ exam: selectedExam, student: '', marks_obtained: '' }) }}>+ Add Result</button>
          </div>
          <div className="card-body">
            {showForm === 'result' && (
              <div className="form-panel">
                <div className="form-panel-title">Add Result</div>
                <form onSubmit={e => save('/examination/results/', e)}>
                  <div className="form-grid">
                    <div className="form-group">
                      <label className="form-label">Student</label>
                      <select name="student" value={form.student || ''} onChange={set} required>
                        <option value="">Select student</option>
                        {students.map(s => <option key={s.id} value={s.id}>{s.first_name} {s.last_name} ({s.register_number})</option>)}
                      </select>
                    </div>
                    <div className="form-group"><label className="form-label">Marks Obtained</label><input type="number" step="0.01" name="marks_obtained" value={form.marks_obtained || ''} onChange={set} required /></div>
                    <div className="form-group"><label className="form-label">Remarks</label><input name="remarks" value={form.remarks || ''} onChange={set} /></div>
                  </div>
                  <div className="form-actions">
                    <button className="btn btn-primary" type="submit">Save</button>
                    <button className="btn btn-outline" type="button" onClick={() => setShowForm(null)}>Cancel</button>
                  </div>
                </form>
              </div>
            )}
            <div className="table-wrap">
              <table>
                <thead><tr><th>Student</th><th>Subject</th><th>Max Marks</th><th>Obtained</th><th>Grade</th><th>Result</th></tr></thead>
                <tbody>
                  {results.length === 0
                    ? <tr><td colSpan={6} style={{ textAlign: 'center', color: 'var(--text-muted)', padding: 32 }}>No results yet</td></tr>
                    : results.map(r => (
                      <tr key={r.id}>
                        <td style={{ fontWeight: 600 }}>{r.student_name}</td>
                        <td>{r.subject}</td>
                        <td>{r.max_marks}</td>
                        <td style={{ fontWeight: 700 }}>{r.marks_obtained}</td>
                        <td>
                          <span style={{ padding: '3px 10px', borderRadius: 999, fontSize: 12, fontWeight: 700, background: (GRADE_COLOR[r.grade] || '#666') + '18', color: GRADE_COLOR[r.grade] || '#666' }}>
                            {r.grade}
                          </span>
                        </td>
                        <td>{r.is_pass ? <span className="badge badge-success">Pass</span> : <span className="badge badge-danger">Fail</span>}</td>
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
