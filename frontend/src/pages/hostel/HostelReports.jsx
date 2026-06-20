import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../../api/axios'
import { ENDPOINTS } from '../../api/endpoints'

const Bar = ({ value, max, color = 'var(--primary)' }) => (
  <div style={{ height: 8, background: 'var(--border)', borderRadius: 4, overflow: 'hidden' }}>
    <div style={{ height: '100%', width: `${max ? (value / max) * 100 : 0}%`, background: color, borderRadius: 4, transition: 'width 0.4s ease' }} />
  </div>
)

const StatCard = ({ label, value, color, icon }) => (
  <div className="card">
    <div className="card-body" style={{ padding: '1rem 1.25rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '0.3rem' }}>{label}</div>
          <div style={{ fontSize: '1.4rem', fontWeight: 700, color: color || 'inherit' }}>{value ?? '—'}</div>
        </div>
        {icon && <div style={{ fontSize: '1.5rem', opacity: 0.25 }}>{icon}</div>}
      </div>
    </div>
  </div>
)

export default function HostelReports() {
  const [data, setData]       = useState(null)
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()

  const load = async () => {
    setLoading(true)
    const res = await api.get(`${ENDPOINTS.HOSTEL_BLOCKS}reports/`)
    setData(res.data)
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  return (
    <div className="page-container">
      <div className="page-header">
        <div>
          <h1 className="page-title">Hostel Reports & Analytics</h1>
          <p className="page-subtitle">Overview of hostel operations and statistics</p>
        </div>
        <button className="btn btn-outline" onClick={load} disabled={loading}>
          {loading ? 'Loading…' : 'Refresh'}
        </button>
      </div>

      {loading && <div className="loader" />}

      {data && !loading && (
        <>
          {/* Allotments */}
          <p style={{ fontWeight: 700, marginBottom: '0.6rem', fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--text-muted)' }}>Allotments</p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: '1rem', marginBottom: '1.5rem' }}>
            <StatCard label="Active"          value={data.allotments_active}  color="var(--success)" icon="🛏️" />
            <StatCard label="Vacated"         value={data.allotments_vacated} icon="🚪" />
            <StatCard label="Apps Approved"   value={data.applications_approved} color="var(--success)" icon="✅" />
            <StatCard label="Apps Pending"    value={data.applications_pending}  color="#f59e0b" icon="📋" />
          </div>

          {/* Fees & Attendance */}
          <p style={{ fontWeight: 700, marginBottom: '0.6rem', fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--text-muted)' }}>Fees & Attendance</p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5,1fr)', gap: '1rem', marginBottom: '1.5rem' }}>
            <StatCard label="Fees Paid"       value={data.fees_paid}    color="var(--success)" icon="💰" />
            <StatCard label="Fees Pending"    value={data.fees_pending}  color="#f59e0b" icon="⏳" />
            <StatCard label="Fees Overdue"    value={data.fees_overdue}  color="var(--danger)" icon="🔴" />
            <StatCard label="Days Present"    value={data.attendance_present} color="var(--success)" icon="✅" />
            <StatCard label="Days Absent"     value={data.attendance_absent}  color="var(--danger)" icon="❌" />
          </div>

          {/* Leave & Complaints side by side */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.5rem' }}>
            <div className="card">
              <div className="card-body">
                <p style={{ fontWeight: 600, marginBottom: '1rem' }}>Leave Requests</p>
                {[
                  ['Approved', data.leaves_approved, 'var(--success)'],
                  ['Pending',  data.leaves_pending,  '#f59e0b'],
                  ['Rejected', data.leaves_rejected,  'var(--danger)'],
                ].map(([label, value, color]) => {
                  const total = data.leaves_approved + data.leaves_pending + data.leaves_rejected || 1
                  return (
                    <div key={label} style={{ marginBottom: '0.9rem' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', marginBottom: '0.3rem' }}>
                        <span style={{ fontWeight: 500 }}>{label}</span>
                        <span style={{ fontWeight: 700 }}>{value}</span>
                      </div>
                      <Bar value={value} max={total} color={color} />
                    </div>
                  )
                })}
              </div>
            </div>

            <div className="card">
              <div className="card-body">
                <p style={{ fontWeight: 600, marginBottom: '1rem' }}>Complaints</p>
                {[
                  ['Open',        data.complaints_open,     'var(--danger)'],
                  ['Resolved',    data.complaints_resolved,  'var(--success)'],
                  ['Applications Rejected', data.applications_rejected, '#6b7280'],
                ].map(([label, value, color]) => {
                  const total = data.complaints_open + data.complaints_resolved + data.applications_rejected || 1
                  return (
                    <div key={label} style={{ marginBottom: '0.9rem' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', marginBottom: '0.3rem' }}>
                        <span style={{ fontWeight: 500 }}>{label}</span>
                        <span style={{ fontWeight: 700 }}>{value}</span>
                      </div>
                      <Bar value={value} max={total} color={color} />
                    </div>
                  )
                })}
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="card">
            <div className="card-body">
              <p style={{ fontWeight: 600, marginBottom: '0.75rem' }}>Quick Actions</p>
              <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
                {[
                  ['Applications',   '/hostel/applications'],
                  ['Rooms',          '/hostel/rooms'],
                  ['Allotments',     '/hostel/allotments'],
                  ['Attendance',     '/hostel/attendance'],
                  ['Fees',           '/hostel/fees'],
                  ['Leave Requests', '/hostel/leaves'],
                  ['Visitors',       '/hostel/visitors'],
                  ['Complaints',     '/hostel/complaints'],
                ].map(([label, path]) => (
                  <button key={path} className="btn btn-outline" onClick={() => navigate(path)}>{label}</button>
                ))}
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
