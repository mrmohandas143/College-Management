import { useState, useEffect } from 'react'
import api from '../../api/axios'
import { ENDPOINTS } from '../../api/endpoints'

const badge = (s, map) => <span className={`badge badge-${map[s] || 'secondary'}`}>{s}</span>

export default function HostelRooms() {
  const [tab, setTab]       = useState('rooms')
  const [blocks, setBlocks] = useState([])
  const [rooms, setRooms]   = useState([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(null)
  const [form, setForm]     = useState({})

  const load = async () => {
    setLoading(true)
    const [bRes, rRes] = await Promise.all([
      api.get(ENDPOINTS.HOSTEL_BLOCKS),
      api.get(ENDPOINTS.HOSTEL_ROOMS),
    ])
    setBlocks(bRes.data.results ?? bRes.data)
    setRooms(rRes.data.results ?? rRes.data)
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  const set = e => setForm(f => ({ ...f, [e.target.name]: e.target.value }))

  const save = async (endpoint, e) => {
    e.preventDefault()
    await api.post(endpoint, form)
    setShowForm(null); setForm({}); load()
  }

  return (
    <div className="page-container">
      <div className="page-header">
        <div>
          <h1 className="page-title">Blocks & Rooms</h1>
          <p className="page-subtitle">Manage hostel blocks and room inventory</p>
        </div>
      </div>

      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem' }}>
        {['rooms', 'blocks'].map(t => (
          <button key={t} className={`btn btn-sm ${tab === t ? 'btn-primary' : 'btn-outline'}`} onClick={() => setTab(t)}>
            {t.charAt(0).toUpperCase() + t.slice(1)}
          </button>
        ))}
      </div>

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
          {loading ? <div className="loader" /> : (
            <div className="table-responsive"><table className="table">
              <thead><tr><th>Block</th><th>Gender</th><th>Warden</th><th>Capacity</th></tr></thead>
              <tbody>{blocks.length === 0 ? <tr><td colSpan={4} style={{ textAlign: 'center' }}>No blocks</td></tr>
                : blocks.map(b => <tr key={b.id}><td>{b.name}</td><td>{b.gender}</td><td>{b.warden || '—'}</td><td>{b.capacity}</td></tr>)}
              </tbody>
            </table></div>
          )}
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
          {loading ? <div className="loader" /> : (
            <div className="table-responsive"><table className="table">
              <thead><tr><th>Block</th><th>Room</th><th>Type</th><th>Capacity</th><th>Occupied</th><th>Floor</th><th>Status</th></tr></thead>
              <tbody>{rooms.length === 0 ? <tr><td colSpan={7} style={{ textAlign: 'center' }}>No rooms</td></tr>
                : rooms.map(r => (
                  <tr key={r.id}>
                    <td>{r.block_name}</td><td>{r.room_number}</td><td>{r.room_type}</td>
                    <td>{r.capacity}</td><td>{r.occupied}</td><td>{r.floor}</td>
                    <td>{badge(r.status, { available: 'success', occupied: 'warning', maintenance: 'danger' })}</td>
                  </tr>
                ))}
              </tbody>
            </table></div>
          )}
        </div></div>
      )}
    </div>
  )
}
