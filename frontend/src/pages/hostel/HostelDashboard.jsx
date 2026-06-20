import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../../api/axios'
import { ENDPOINTS } from '../../api/endpoints'

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

export default function HostelDashboard() {
  const [stats, setStats] = useState(null)
  const navigate = useNavigate()

  useEffect(() => {
    api.get(`${ENDPOINTS.HOSTEL_BLOCKS}stats/`).then(r => setStats(r.data))
  }, [])

  const cards = stats ? [
    ['Total Blocks',          stats.total_blocks,          'inherit',          '🏢'],
    ['Total Rooms',           stats.total_rooms,           'inherit',          '🚪'],
    ['Available Rooms',       stats.available_rooms,       'var(--success)',    '✅'],
    ['Occupied Rooms',        stats.occupied_rooms,        '#f59e0b',          '🛏️'],
    ['Active Allotments',     stats.total_allotments,      'var(--primary)',    '👤'],
    ['Pending Applications',  stats.pending_applications,  '#f59e0b',          '📋'],
    ['Pending Leaves',        stats.pending_leaves,        '#f59e0b',          '📅'],
    ['Open Complaints',       stats.open_complaints,       'var(--danger)',     '⚠️'],
    ['Pending Fees',          stats.pending_fees,          '#f59e0b',          '💰'],
    ['Overdue Fees',          stats.overdue_fees,          'var(--danger)',     '🔴'],
  ] : []

  return (
    <div className="page-container">
      <div className="page-header">
        <div>
          <h1 className="page-title">Hostel Management</h1>
          <p className="page-subtitle">Overview of hostel operations</p>
        </div>
      </div>

      {!stats ? <div className="loader" /> : (
        <>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5,1fr)', gap: '1rem', marginBottom: '1.5rem' }}>
            {cards.map(([label, value, color, icon]) => (
              <StatCard key={label} label={label} value={value} color={color} icon={icon} />
            ))}
          </div>

          <div className="card">
            <div className="card-body">
              <p style={{ fontWeight: 600, marginBottom: '0.75rem' }}>Quick Actions</p>
              <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
                {[
                  ['Applications',  '/hostel/applications'],
                  ['Rooms',         '/hostel/rooms'],
                  ['Allotments',    '/hostel/allotments'],
                  ['Attendance',    '/hostel/attendance'],
                  ['Fees',          '/hostel/fees'],
                  ['Leave Requests','/hostel/leaves'],
                  ['Visitors',      '/hostel/visitors'],
                  ['Complaints',    '/hostel/complaints'],
                  ['Reports',       '/hostel/reports'],
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
