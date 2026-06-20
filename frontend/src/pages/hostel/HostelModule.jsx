import { useState, useEffect } from 'react'
import api from '../../api/axios'
import { ENDPOINTS } from '../../api/endpoints'

const badge = (s, map) => <span className={`badge badge-${map[s] || 'secondary'}`}>{s?.replace('_', ' ')}</span>

export default function HostelModule() {
  const [tab, setTab]       = useState('dashboard')
  const [blocks, setBlocks] = useState([])
  const [rooms, setRooms]   = useState([])
  const [allotments, setAllotments] = useState([])
  const [complaints, setComplaints] = useState([])
  const [stats, setStats]   = useState(null)
  const [loading, setLoading] = useState(false)
  const [showForm, setShowForm] = useState(null)
  const [form, setForm]     = useState({})

  const load = async () => {
    setLoading(true)
    const [bl, ro, al, co, st] = await Promise.all([
      api.get(ENDPOINTS.HOSTEL_BLOCKS),
      api.get(ENDPOINTS.HOSTEL_ROOMS),
      api.get(ENDPOINTS.HOSTEL_ALLOTMENTS, { params: { status: 'active' } }),
      api.get(ENDPOINTS.HOSTEL_COMPLAINTS),
      api.get(`${ENDPOINTS.HOSTEL_BLOCKS}stats/`),
    ])
    setBlocks(bl.data.results ?? bl.data)
    setRooms(ro.data.results ?? ro.data)
    setAllotments(al.data.results ?? al.data)
    setComplaints(co.data.results ?? co.data)
    setStats(st.data)
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  const set = e => setForm(f => ({ ...f, [e.target.name]: e.target.value }))

  const save = async (endpoint, e) => {
    e.preventDefault()
    await api.post(endpoint, form)
    setShowForm(null); setForm({}); load()
  }

  const updateComplaint = async (id, status) => {
    await api.patch(`${ENDPOINTS.HOSTEL_COMPLAINTS}${id}/`, { status })
    load()
  }

  return (
    <div className="page-container">
      <div className="page-header">
        <div><h1 className="page-title">Hostel Management</h1><p className="page-subtitle">Blocks, rooms, allotments & complaints</p></div>
      </div>

      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem' }}>
        {['dashboard','blocks','rooms','allotments','complaints'].map(t => (
          <button key={t} className={`btn btn-sm ${tab === t ? 'btn-primary' : 'btn-outline'}`} onClick={() => setTab(t)}>{t.charAt(0).toUpperCase() + t.slice(1)}</button>
        ))}
      </div>

      {tab === 'dashboard' && stats && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: '1rem' }}>
          {[['Blocks', stats.total_blocks, ''], ['Total Rooms', stats.total_rooms, ''], ['Available Rooms', stats.available_rooms, 'success'],
            ['Occupied Rooms', stats.occupied_rooms, 'warning'], ['Active Allotments', stats.total_allotments, ''], ['Open Complaints', stats.open_complaints, 'danger']
          ].map(([l, v, c]) => (
            <div key={l} className="card"><div className="card-body" style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>{l}</div>
              <div style={{ fontSize: '1.8rem', fontWeight: 700, color: c === 'danger' ? 'var(--danger)' : c === 'success' ? 'var(--success)' : c === 'warning' ? '#f59e0b' : 'inherit' }}>{v}</div>
            </div></div>
          ))}
        </div>
      )}

      {tab === 'blocks' && (
        <div className="card"><div className="card-body">
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '1rem' }}>
            <button className="btn btn-primary" onClick={() => { setShowForm('block'); setForm({ name: '', gender: 'mixed', warden: '', capacity: '' }) }}>+ Add Block</button>
          </div>
          {showForm === 'block' && (
            <form onSubmit={e => save(ENDPOINTS.HOSTEL_BLOCKS, e)} style={{ background: 'var(--bg)', padding: '1rem', borderRadius: 8, marginBottom: '1rem' }}>
              <div className="form-grid">
                <div className="form-group"><label className="form-label">Block Name</label><input className="form-control" name="name" value={form.name || ''} onChange={set} required /></div>
                <div className="form-group"><label className="form-label">Gender</label>
                  <select className="form-control" name="gender" value={form.gender || 'mixed'} onChange={set}>
                    <option value="male">Male</option><option value="female">Female</option><option value="mixed">Mixed</option>
                  </select>
                </div>
                <div className="form-group"><label className="form-label">Warden</label><input className="form-control" name="warden" value={form.warden || ''} onChange={set} /></div>
                <div className="form-group"><label className="form-label">Capacity</label><input className="form-control" type="number" name="capacity" value={form.capacity || ''} onChange={set} /></div>
              </div>
              <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.75rem' }}>
                <button className="btn btn-primary" type="submit">Save</button>
                <button className="btn btn-outline" type="button" onClick={() => setShowForm(null)}>Cancel</button>
              </div>
            </form>
          )}
          <div className="table-responsive"><table className="table">
            <thead><tr><th>Block</th><th>Gender</th><th>Warden</th><th>Capacity</th></tr></thead>
            <tbody>{blocks.length === 0 ? <tr><td colSpan={4} style={{ textAlign: 'center' }}>No blocks</td></tr>
              : blocks.map(b => <tr key={b.id}><td>{b.name}</td><td>{b.gender}</td><td>{b.warden || '—'}</td><td>{b.capacity}</td></tr>)}
            </tbody>
          </table></div>
        </div></div>
      )}

      {tab === 'rooms' && (
        <div className="card"><div className="card-body">
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '1rem' }}>
            <button className="btn btn-primary" onClick={() => { setShowForm('room'); setForm({ block: '', room_number: '', room_type: 'double', capacity: 2, floor: 1 }) }}>+ Add Room</button>
          </div>
          {showForm === 'room' && (
            <form onSubmit={e => save(ENDPOINTS.HOSTEL_ROOMS, e)} style={{ background: 'var(--bg)', padding: '1rem', borderRadius: 8, marginBottom: '1rem' }}>
              <div className="form-grid">
                <div className="form-group"><label className="form-label">Block</label>
                  <select className="form-control" name="block" value={form.block || ''} onChange={set} required>
                    <option value="">Select block</option>{blocks.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
                  </select>
                </div>
                <div className="form-group"><label className="form-label">Room Number</label><input className="form-control" name="room_number" value={form.room_number || ''} onChange={set} required /></div>
                <div className="form-group"><label className="form-label">Type</label>
                  <select className="form-control" name="room_type" value={form.room_type || 'double'} onChange={set}>
                    <option value="single">Single</option><option value="double">Double</option><option value="triple">Triple</option>
                  </select>
                </div>
                <div className="form-group"><label className="form-label">Capacity</label><input className="form-control" type="number" name="capacity" value={form.capacity || 2} onChange={set} /></div>
                <div className="form-group"><label className="form-label">Floor</label><input className="form-control" type="number" name="floor" value={form.floor || 1} onChange={set} /></div>
              </div>
              <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.75rem' }}>
                <button className="btn btn-primary" type="submit">Save</button>
                <button className="btn btn-outline" type="button" onClick={() => setShowForm(null)}>Cancel</button>
              </div>
            </form>
          )}
          <div className="table-responsive"><table className="table">
            <thead><tr><th>Block</th><th>Room</th><th>Type</th><th>Capacity</th><th>Occupied</th><th>Floor</th><th>Status</th></tr></thead>
            <tbody>{rooms.length === 0 ? <tr><td colSpan={7} style={{ textAlign: 'center' }}>No rooms</td></tr>
              : rooms.map(r => <tr key={r.id}><td>{r.block_name}</td><td>{r.room_number}</td><td>{r.room_type}</td><td>{r.capacity}</td><td>{r.occupied}</td><td>{r.floor}</td>
                <td>{badge(r.status, { available: 'success', occupied: 'warning', maintenance: 'danger' })}</td></tr>)}
            </tbody>
          </table></div>
        </div></div>
      )}

      {tab === 'allotments' && (
        <div className="card"><div className="card-body">
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '1rem' }}>
            <button className="btn btn-primary" onClick={() => { setShowForm('allotment'); setForm({ room: '', student_name: '', student_id: '', contact: '', allotment_date: new Date().toISOString().split('T')[0] }) }}>+ Allot Room</button>
          </div>
          {showForm === 'allotment' && (
            <form onSubmit={e => save(ENDPOINTS.HOSTEL_ALLOTMENTS, e)} style={{ background: 'var(--bg)', padding: '1rem', borderRadius: 8, marginBottom: '1rem' }}>
              <div className="form-grid">
                <div className="form-group"><label className="form-label">Room</label>
                  <select className="form-control" name="room" value={form.room || ''} onChange={set} required>
                    <option value="">Select room</option>{rooms.filter(r => r.status === 'available').map(r => <option key={r.id} value={r.id}>{r.block_name} — {r.room_number}</option>)}
                  </select>
                </div>
                <div className="form-group"><label className="form-label">Student Name</label><input className="form-control" name="student_name" value={form.student_name || ''} onChange={set} required /></div>
                <div className="form-group"><label className="form-label">Student ID</label><input className="form-control" name="student_id" value={form.student_id || ''} onChange={set} /></div>
                <div className="form-group"><label className="form-label">Contact</label><input className="form-control" name="contact" value={form.contact || ''} onChange={set} /></div>
                <div className="form-group"><label className="form-label">Allotment Date</label><input className="form-control" type="date" name="allotment_date" value={form.allotment_date || ''} onChange={set} required /></div>
              </div>
              <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.75rem' }}>
                <button className="btn btn-primary" type="submit">Allot</button>
                <button className="btn btn-outline" type="button" onClick={() => setShowForm(null)}>Cancel</button>
              </div>
            </form>
          )}
          <div className="table-responsive"><table className="table">
            <thead><tr><th>Student</th><th>Room</th><th>Contact</th><th>Allotment Date</th><th>Status</th></tr></thead>
            <tbody>{allotments.length === 0 ? <tr><td colSpan={5} style={{ textAlign: 'center' }}>No allotments</td></tr>
              : allotments.map(a => <tr key={a.id}><td>{a.student_name}</td><td>{a.room_info}</td><td>{a.contact || '—'}</td><td>{a.allotment_date}</td>
                <td>{badge(a.status, { active: 'success', vacated: 'secondary' })}</td></tr>)}
            </tbody>
          </table></div>
        </div></div>
      )}

      {tab === 'complaints' && (
        <div className="card"><div className="card-body">
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '1rem' }}>
            <button className="btn btn-primary" onClick={() => { setShowForm('complaint'); setForm({ student_name: '', complaint: '', room: '' }) }}>+ File Complaint</button>
          </div>
          {showForm === 'complaint' && (
            <form onSubmit={e => save(ENDPOINTS.HOSTEL_COMPLAINTS, e)} style={{ background: 'var(--bg)', padding: '1rem', borderRadius: 8, marginBottom: '1rem' }}>
              <div className="form-grid">
                <div className="form-group"><label className="form-label">Student Name</label><input className="form-control" name="student_name" value={form.student_name || ''} onChange={set} required /></div>
                <div className="form-group"><label className="form-label">Room</label>
                  <select className="form-control" name="room" value={form.room || ''} onChange={set}>
                    <option value="">Select room</option>{rooms.map(r => <option key={r.id} value={r.id}>{r.block_name} — {r.room_number}</option>)}
                  </select>
                </div>
              </div>
              <div className="form-group"><label className="form-label">Complaint</label><textarea className="form-control" name="complaint" value={form.complaint || ''} onChange={set} rows={3} required /></div>
              <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.75rem' }}>
                <button className="btn btn-primary" type="submit">Submit</button>
                <button className="btn btn-outline" type="button" onClick={() => setShowForm(null)}>Cancel</button>
              </div>
            </form>
          )}
          <div className="table-responsive"><table className="table">
            <thead><tr><th>Student</th><th>Complaint</th><th>Filed On</th><th>Status</th><th>Actions</th></tr></thead>
            <tbody>{complaints.length === 0 ? <tr><td colSpan={5} style={{ textAlign: 'center' }}>No complaints</td></tr>
              : complaints.map(c => (
                <tr key={c.id}>
                  <td>{c.student_name}</td>
                  <td style={{ maxWidth: 250, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{c.complaint}</td>
                  <td>{new Date(c.filed_on).toLocaleDateString()}</td>
                  <td>{badge(c.status, { open: 'danger', in_progress: 'warning', resolved: 'success' })}</td>
                  <td style={{ display: 'flex', gap: '0.25rem' }}>
                    {c.status === 'open' && <button className="btn btn-sm btn-warning" onClick={() => updateComplaint(c.id, 'in_progress')}>In Progress</button>}
                    {c.status !== 'resolved' && <button className="btn btn-sm btn-success" onClick={() => updateComplaint(c.id, 'resolved')}>Resolve</button>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table></div>
        </div></div>
      )}
    </div>
  )
}
