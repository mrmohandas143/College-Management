import { useState, useEffect } from 'react'
import api from '../../api/axios'
import { ENDPOINTS } from '../../api/endpoints'

const VEH_BADGE = { active: 'badge-success', maintenance: 'badge-warning', inactive: 'badge-danger' }

export default function TransportModule() {
  const [tab, setTab]               = useState('dashboard')
  const [routes, setRoutes]         = useState([])
  const [vehicles, setVehicles]     = useState([])
  const [allotments, setAllotments] = useState([])
  const [stats, setStats]           = useState(null)
  const [showForm, setShowForm]     = useState(null)
  const [form, setForm]             = useState({})

  const load = async () => {
    const [ro, ve, al, st] = await Promise.all([
      api.get(ENDPOINTS.TRANSPORT_ROUTES),
      api.get(ENDPOINTS.TRANSPORT_VEHICLES),
      api.get(ENDPOINTS.TRANSPORT_ALLOTMENTS, { params: { is_active: true } }),
      api.get(`${ENDPOINTS.TRANSPORT_ROUTES}stats/`),
    ])
    setRoutes(ro.data.results ?? ro.data)
    setVehicles(ve.data.results ?? ve.data)
    setAllotments(al.data.results ?? al.data)
    setStats(st.data)
  }

  useEffect(() => { load() }, [])

  const set = e => setForm(f => ({ ...f, [e.target.name]: e.target.value }))

  const save = async (endpoint, e) => {
    e.preventDefault()
    await api.post(endpoint, form)
    setShowForm(null); setForm({}); load()
  }

  const KPI_DATA = stats ? [
    { label: 'Total Routes',    value: stats.total_routes,    color: '#2563eb', icon: '🗺️' },
    { label: 'Total Vehicles',  value: stats.total_vehicles,  color: '#7c3aed', icon: '🚌' },
    { label: 'Active Vehicles', value: stats.active_vehicles, color: '#22c55e', icon: '✅' },
    { label: 'Allotments',      value: stats.total_allotments,color: '#0891b2', icon: '👤' },
  ] : []

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <div className="page-header" style={{ marginBottom: 0 }}>
        <div><h1>Transport Management</h1><p>Routes, vehicles &amp; allotments</p></div>
      </div>

      <div className="mod-tabs">
        {[['dashboard','📊 Dashboard'],['routes','🗺️ Routes'],['vehicles','🚌 Vehicles'],['allotments','👤 Allotments']].map(([t, label]) => (
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

      {tab === 'routes' && (
        <div className="card">
          <div className="card-header">
            <h3>Routes</h3>
            <button className="btn btn-primary btn-sm" onClick={() => { setShowForm('route'); setForm({ name: '', start_point: '', end_point: '', distance_km: '', stops: '', fare: '' }) }}>+ Add Route</button>
          </div>
          <div className="card-body">
            {showForm === 'route' && (
              <div className="form-panel">
                <div className="form-panel-title">Add Route</div>
                <form onSubmit={e => save(ENDPOINTS.TRANSPORT_ROUTES, e)}>
                  <div className="form-grid">
                    {[['Route Name','name'],['Start Point','start_point'],['End Point','end_point'],['Distance (km)','distance_km','number'],['Fare (₹)','fare','number']].map(([l, n, t='text']) => (
                      <div key={n} className="form-group"><label className="form-label">{l}</label><input type={t} name={n} value={form[n] || ''} onChange={set} /></div>
                    ))}
                  </div>
                  <div className="form-group"><label className="form-label">Stops (comma-separated)</label><input name="stops" value={form.stops || ''} onChange={set} /></div>
                  <div className="form-actions">
                    <button className="btn btn-primary" type="submit">Save Route</button>
                    <button className="btn btn-outline" type="button" onClick={() => setShowForm(null)}>Cancel</button>
                  </div>
                </form>
              </div>
            )}
            <div className="table-wrap">
              <table>
                <thead><tr><th>Route</th><th>From</th><th>To</th><th>Distance</th><th>Fare</th><th>Vehicles</th></tr></thead>
                <tbody>
                  {routes.length === 0
                    ? <tr><td colSpan={6} style={{ textAlign: 'center', color: 'var(--text-muted)', padding: 32 }}>No routes added</td></tr>
                    : routes.map(r => (
                      <tr key={r.id}>
                        <td style={{ fontWeight: 600 }}>{r.name}</td>
                        <td>{r.start_point}</td>
                        <td>{r.end_point}</td>
                        <td>{r.distance_km} km</td>
                        <td><strong>₹{r.fare}</strong></td>
                        <td>{r.vehicle_count}</td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {tab === 'vehicles' && (
        <div className="card">
          <div className="card-header">
            <h3>Vehicles</h3>
            <button className="btn btn-primary btn-sm" onClick={() => { setShowForm('vehicle'); setForm({ reg_number: '', vehicle_type: 'Bus', capacity: 40, driver_name: '', driver_phone: '', route: '', status: 'active' }) }}>+ Add Vehicle</button>
          </div>
          <div className="card-body">
            {showForm === 'vehicle' && (
              <div className="form-panel">
                <div className="form-panel-title">Add Vehicle</div>
                <form onSubmit={e => save(ENDPOINTS.TRANSPORT_VEHICLES, e)}>
                  <div className="form-grid">
                    {[['Reg Number','reg_number'],['Type','vehicle_type'],['Capacity','capacity','number'],['Driver Name','driver_name'],['Driver Phone','driver_phone']].map(([l, n, t='text']) => (
                      <div key={n} className="form-group"><label className="form-label">{l}</label><input type={t} name={n} value={form[n] || ''} onChange={set} /></div>
                    ))}
                    <div className="form-group">
                      <label className="form-label">Route</label>
                      <select name="route" value={form.route || ''} onChange={set}>
                        <option value="">Select route</option>
                        {routes.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
                      </select>
                    </div>
                    <div className="form-group">
                      <label className="form-label">Status</label>
                      <select name="status" value={form.status || 'active'} onChange={set}>
                        <option value="active">Active</option><option value="maintenance">Maintenance</option><option value="inactive">Inactive</option>
                      </select>
                    </div>
                  </div>
                  <div className="form-actions">
                    <button className="btn btn-primary" type="submit">Save Vehicle</button>
                    <button className="btn btn-outline" type="button" onClick={() => setShowForm(null)}>Cancel</button>
                  </div>
                </form>
              </div>
            )}
            <div className="table-wrap">
              <table>
                <thead><tr><th>Reg No</th><th>Type</th><th>Capacity</th><th>Driver</th><th>Route</th><th>Status</th></tr></thead>
                <tbody>
                  {vehicles.length === 0
                    ? <tr><td colSpan={6} style={{ textAlign: 'center', color: 'var(--text-muted)', padding: 32 }}>No vehicles added</td></tr>
                    : vehicles.map(v => (
                      <tr key={v.id}>
                        <td style={{ fontWeight: 600 }}>{v.reg_number}</td>
                        <td>{v.vehicle_type}</td>
                        <td>{v.capacity}</td>
                        <td>{v.driver_name || '—'}</td>
                        <td>{v.route_name || '—'}</td>
                        <td><span className={`badge ${VEH_BADGE[v.status] || 'badge-gray'}`}>{v.status}</span></td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {tab === 'allotments' && (
        <div className="card">
          <div className="card-header">
            <h3>Transport Allotments</h3>
            <button className="btn btn-primary btn-sm" onClick={() => { setShowForm('allotment'); setForm({ student_name: '', student_id: '', route: '', vehicle: '', boarding_stop: '', valid_from: new Date().toISOString().split('T')[0] }) }}>+ Allot Transport</button>
          </div>
          <div className="card-body">
            {showForm === 'allotment' && (
              <div className="form-panel">
                <div className="form-panel-title">Allot Transport</div>
                <form onSubmit={e => save(ENDPOINTS.TRANSPORT_ALLOTMENTS, e)}>
                  <div className="form-grid">
                    <div className="form-group"><label className="form-label">Student Name</label><input name="student_name" value={form.student_name || ''} onChange={set} required /></div>
                    <div className="form-group"><label className="form-label">Student ID</label><input name="student_id" value={form.student_id || ''} onChange={set} /></div>
                    <div className="form-group">
                      <label className="form-label">Route</label>
                      <select name="route" value={form.route || ''} onChange={set} required>
                        <option value="">Select route</option>
                        {routes.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
                      </select>
                    </div>
                    <div className="form-group">
                      <label className="form-label">Vehicle</label>
                      <select name="vehicle" value={form.vehicle || ''} onChange={set}>
                        <option value="">Select vehicle</option>
                        {vehicles.map(v => <option key={v.id} value={v.id}>{v.reg_number}</option>)}
                      </select>
                    </div>
                    <div className="form-group"><label className="form-label">Boarding Stop</label><input name="boarding_stop" value={form.boarding_stop || ''} onChange={set} /></div>
                    <div className="form-group"><label className="form-label">Valid From</label><input type="date" name="valid_from" value={form.valid_from || ''} onChange={set} required /></div>
                  </div>
                  <div className="form-actions">
                    <button className="btn btn-primary" type="submit">Allot</button>
                    <button className="btn btn-outline" type="button" onClick={() => setShowForm(null)}>Cancel</button>
                  </div>
                </form>
              </div>
            )}
            <div className="table-wrap">
              <table>
                <thead><tr><th>Student</th><th>Route</th><th>Vehicle</th><th>Boarding Stop</th><th>Valid From</th><th>Active</th></tr></thead>
                <tbody>
                  {allotments.length === 0
                    ? <tr><td colSpan={6} style={{ textAlign: 'center', color: 'var(--text-muted)', padding: 32 }}>No allotments</td></tr>
                    : allotments.map(a => (
                      <tr key={a.id}>
                        <td style={{ fontWeight: 600 }}>{a.student_name}</td>
                        <td>{a.route_name}</td>
                        <td>{a.vehicle_reg || '—'}</td>
                        <td>{a.boarding_stop || '—'}</td>
                        <td>{a.valid_from}</td>
                        <td>{a.is_active ? <span className="badge badge-success">Active</span> : <span className="badge badge-gray">Inactive</span>}</td>
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
