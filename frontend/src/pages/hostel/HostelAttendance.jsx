import { useState, useEffect } from 'react'
import api from '../../api/axios'
import { ENDPOINTS } from '../../api/endpoints'

const TODAY = new Date().toISOString().split('T')[0]

export default function HostelAttendance() {
  const [tab, setTab]           = useState('mark')
  const [date, setDate]         = useState(TODAY)
  const [allotments, setAllotments] = useState([])
  const [records, setRecords]   = useState({})
  const [history, setHistory]   = useState([])
  const [filterDate, setFilterDate] = useState(TODAY)
  const [loading, setLoading]   = useState(false)
  const [saving, setSaving]     = useState(false)

  useEffect(() => {
    api.get(ENDPOINTS.HOSTEL_ALLOTMENTS, { params: { status: 'active' } }).then(r => {
      const list = r.data.results ?? r.data
      setAllotments(list)
      const init = {}
      list.forEach(a => { init[a.id] = { present: true, check_in: '', check_out: '' } })
      setRecords(init)
    })
  }, [])

  async function loadHistory() {
    setLoading(true)
    const res = await api.get(ENDPOINTS.HOSTEL_ATTENDANCE, { params: { date: filterDate } })
    setHistory(res.data.results ?? res.data)
    setLoading(false)
  }

  useEffect(() => {
    if (tab === 'history') loadHistory()
  }, [tab, filterDate])

  const handleSave = async () => {
    setSaving(true)
    const payload = allotments.map(a => ({
      allotment: a.id,
      date,
      present:   records[a.id]?.present ?? true,
      check_in:  records[a.id]?.check_in || null,
      check_out: records[a.id]?.check_out || null,
    }))
    await Promise.all(payload.map(p => api.post(ENDPOINTS.HOSTEL_ATTENDANCE, p).catch(() => {})))
    setSaving(false)
    alert('Attendance saved.')
  }

  const setField = (id, field, value) =>
    setRecords(r => ({ ...r, [id]: { ...r[id], [field]: value } }))

  const setAll = (present) => {
    const updated = {}
    allotments.forEach(a => { updated[a.id] = { ...records[a.id], present } })
    setRecords(updated)
  }

  return (
    <div className="page-container">
      <div className="page-header">
        <div>
          <h1 className="page-title">Hostel Attendance</h1>
          <p className="page-subtitle">Track daily student attendance in hostel</p>
        </div>
      </div>

      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem' }}>
        {['mark', 'history'].map(t => (
          <button key={t} className={`btn btn-sm ${tab === t ? 'btn-primary' : 'btn-outline'}`} onClick={() => setTab(t)}>
            {t === 'mark' ? 'Mark Attendance' : 'Attendance History'}
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
                <button className="btn btn-sm btn-outline" onClick={() => setAll(true)}>Present</button>
                <button className="btn btn-sm btn-outline" onClick={() => setAll(false)}>Absent</button>
              </div>
            </div>

            <div className="table-responsive">
              <table className="table">
                <thead>
                  <tr><th>Student</th><th>Room</th><th>Status</th><th>Check In</th><th>Check Out</th></tr>
                </thead>
                <tbody>
                  {allotments.length === 0
                    ? <tr><td colSpan={5} style={{ textAlign: 'center' }}>No active allotments</td></tr>
                    : allotments.map(a => (
                      <tr key={a.id}>
                        <td>{a.student_name}</td>
                        <td>{a.room_info}</td>
                        <td>
                          <select
                            className="form-control"
                            style={{ padding: '0.25rem 0.5rem', minWidth: 100 }}
                            value={records[a.id]?.present ? 'present' : 'absent'}
                            onChange={e => setField(a.id, 'present', e.target.value === 'present')}
                          >
                            <option value="present">Present</option>
                            <option value="absent">Absent</option>
                          </select>
                        </td>
                        <td>
                          <input type="time" className="form-control" style={{ padding: '0.25rem', minWidth: 100 }}
                            value={records[a.id]?.check_in || ''}
                            disabled={!records[a.id]?.present}
                            onChange={e => setField(a.id, 'check_in', e.target.value)} />
                        </td>
                        <td>
                          <input type="time" className="form-control" style={{ padding: '0.25rem', minWidth: 100 }}
                            value={records[a.id]?.check_out || ''}
                            disabled={!records[a.id]?.present}
                            onChange={e => setField(a.id, 'check_out', e.target.value)} />
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
            <button className="btn btn-primary" style={{ marginTop: '1rem' }} onClick={handleSave} disabled={saving}>
              {saving ? 'Saving...' : 'Save Attendance'}
            </button>
          </div>
        </div>
      )}

      {tab === 'history' && (
        <div className="card">
          <div className="card-body">
            <div style={{ marginBottom: '1rem' }}>
              <div className="form-group" style={{ margin: 0, display: 'inline-block' }}>
                <label className="form-label">Date</label>
                <input className="form-control" type="date" value={filterDate} onChange={e => setFilterDate(e.target.value)} />
              </div>
            </div>
            {loading ? <div className="loader" /> : (
              <div className="table-responsive">
                <table className="table">
                  <thead>
                    <tr><th>Student</th><th>Room</th><th>Date</th><th>Status</th><th>Check In</th><th>Check Out</th></tr>
                  </thead>
                  <tbody>
                    {history.length === 0
                      ? <tr><td colSpan={6} style={{ textAlign: 'center' }}>No records for this date</td></tr>
                      : history.map(h => (
                        <tr key={h.id}>
                          <td>{h.student_name}</td>
                          <td>{h.room_info}</td>
                          <td>{h.date}</td>
                          <td>
                            <span className={`badge badge-${h.present ? 'success' : 'danger'}`}>
                              {h.present ? 'Present' : 'Absent'}
                            </span>
                          </td>
                          <td>{h.check_in || '—'}</td>
                          <td>{h.check_out || '—'}</td>
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
