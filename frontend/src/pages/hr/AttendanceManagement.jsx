import { useState, useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'
import { getAttendance, getAttendanceSummary, bulkMarkAttendance } from '../../services/hrService'
import { getEmployees } from '../../services/hrService'

const TODAY = new Date().toISOString().split('T')[0]
const STATUS_OPTS = ['present', 'absent', 'half_day', 'holiday']
const STATUS_COLOR = { present: 'success', absent: 'danger', half_day: 'warning', holiday: 'secondary' }

export default function AttendanceManagement() {
  const [searchParams] = useSearchParams()
  const [tab, setTab] = useState('mark')
  const [date, setDate] = useState(TODAY)
  const [month, setMonth] = useState(new Date().getMonth() + 1)
  const [year, setYear] = useState(new Date().getFullYear())
  const [employees, setEmployees] = useState([])
  const [records, setRecords] = useState({})   // { empId: status }
  const [existing, setExisting] = useState([])
  const [summary, setSummary] = useState([])
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    getEmployees({ status: 'active' }).then(r => {
      const emps = r.data.results ?? r.data
      setEmployees(emps)
      const init = {}
      emps.forEach(e => { init[e.id] = 'present' })
      setRecords(init)
    })
  }, [])

  useEffect(() => {
    if (tab === 'mark') loadExisting()
    if (tab === 'summary') loadSummary()
  }, [date, tab, month, year])

  const loadExisting = async () => {
    const res = await getAttendance({ date })
    const map = {}
    ;(res.data.results ?? res.data).forEach(r => { map[r.employee] = r.status })
    setExisting(res.data.results ?? res.data)
    setRecords(prev => {
      const updated = { ...prev }
      Object.keys(map).forEach(k => { updated[k] = map[k] })
      return updated
    })
  }

  const loadSummary = async () => {
    setLoading(true)
    const res = await getAttendanceSummary({ month, year })
    setSummary(res.data)
    setLoading(false)
  }

  const handleBulkMark = async () => {
    setSaving(true)
    const payload = employees.map(e => ({ employee: e.id, date, status: records[e.id] || 'present' }))
    await bulkMarkAttendance(payload)
    setSaving(false)
    loadExisting()
  }

  const setAll = (status) => {
    const updated = {}
    employees.forEach(e => { updated[e.id] = status })
    setRecords(updated)
  }

  return (
    <div className="page-container">
      <div className="page-header">
        <div>
          <h1 className="page-title">Attendance Management</h1>
          <p className="page-subtitle">Track daily attendance and view monthly summaries</p>
        </div>
      </div>

      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem' }}>
        {['mark', 'summary'].map(t => (
          <button key={t} className={`btn btn-sm ${tab === t ? 'btn-primary' : 'btn-outline'}`} onClick={() => setTab(t)}>
            {t === 'mark' ? 'Mark Attendance' : 'Monthly Summary'}
          </button>
        ))}
      </div>

      {tab === 'mark' && (
        <div className="card">
          <div className="card-body">
            <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', marginBottom: '1rem', flexWrap: 'wrap' }}>
              <div className="form-group" style={{ margin: 0 }}>
                <label className="form-label">Date</label>
                <input className="form-control" type="date" value={date} onChange={e => setDate(e.target.value)} />
              </div>
              <div style={{ display: 'flex', gap: '0.5rem', alignSelf: 'flex-end' }}>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', alignSelf: 'center' }}>Mark all:</span>
                {STATUS_OPTS.map(s => (
                  <button key={s} className="btn btn-sm btn-outline" onClick={() => setAll(s)}>{s.replace('_', ' ')}</button>
                ))}
              </div>
            </div>

            <div className="table-responsive">
              <table className="table">
                <thead>
                  <tr><th>Employee</th><th>Department</th><th>Status</th><th>Check In</th><th>Check Out</th></tr>
                </thead>
                <tbody>
                  {employees.map(emp => (
                    <tr key={emp.id}>
                      <td>{emp.first_name} {emp.last_name}</td>
                      <td>{emp.department_name || '—'}</td>
                      <td>
                        <select
                          className="form-control"
                          style={{ padding: '0.25rem 0.5rem', minWidth: 110 }}
                          value={records[emp.id] || 'present'}
                          onChange={e => setRecords(r => ({ ...r, [emp.id]: e.target.value }))}
                        >
                          {STATUS_OPTS.map(s => <option key={s} value={s}>{s.replace('_', ' ')}</option>)}
                        </select>
                      </td>
                      <td>
                        <input type="time" className="form-control" style={{ padding: '0.25rem', minWidth: 100 }}
                          disabled={records[emp.id] === 'absent' || records[emp.id] === 'holiday'} />
                      </td>
                      <td>
                        <input type="time" className="form-control" style={{ padding: '0.25rem', minWidth: 100 }}
                          disabled={records[emp.id] === 'absent' || records[emp.id] === 'holiday'} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <button className="btn btn-primary" style={{ marginTop: '1rem' }} onClick={handleBulkMark} disabled={saving}>
              {saving ? 'Saving...' : 'Save Attendance'}
            </button>
          </div>
        </div>
      )}

      {tab === 'summary' && (
        <div className="card">
          <div className="card-body">
            <div style={{ display: 'flex', gap: '1rem', marginBottom: '1rem', flexWrap: 'wrap' }}>
              <div className="form-group" style={{ margin: 0 }}>
                <label className="form-label">Month</label>
                <select className="form-control" value={month} onChange={e => setMonth(e.target.value)}>
                  {Array.from({ length: 12 }, (_, i) => (
                    <option key={i + 1} value={i + 1}>{new Date(0, i).toLocaleString('default', { month: 'long' })}</option>
                  ))}
                </select>
              </div>
              <div className="form-group" style={{ margin: 0 }}>
                <label className="form-label">Year</label>
                <input className="form-control" type="number" value={year} onChange={e => setYear(e.target.value)} style={{ width: 100 }} />
              </div>
            </div>

            {loading ? <div className="loader" /> : (
              <div className="table-responsive">
                <table className="table">
                  <thead>
                    <tr><th>Employee</th><th>Department</th><th>Present</th><th>Absent</th><th>Half Day</th><th>Holiday</th><th>Total Marked</th></tr>
                  </thead>
                  <tbody>
                    {summary.length === 0
                      ? <tr><td colSpan={7} style={{ textAlign: 'center' }}>No data</td></tr>
                      : summary.map(s => (
                        <tr key={s.employee_id}>
                          <td>{s.employee_name}</td>
                          <td>{s.department || '—'}</td>
                          <td><span className="badge badge-success">{s.present}</span></td>
                          <td><span className="badge badge-danger">{s.absent}</span></td>
                          <td><span className="badge badge-warning">{s.half_day}</span></td>
                          <td><span className="badge badge-secondary">{s.holiday}</span></td>
                          <td>{s.total_marked}</td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
