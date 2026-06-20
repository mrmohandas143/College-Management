import { useNavigate } from 'react-router-dom'
import useAuth from '../../hooks/useAuth'

const MODULE_TREE = [
  { label: 'Authentication Module',      path: null,           icon: '🔐', desc: 'Login, JWT, role-based access' },
  { label: 'Dashboard Module',           path: '/dashboard',   icon: '📊', desc: 'Overview, charts, quick stats' },
  { label: 'Student Management',         path: '/students',    icon: '🎓', desc: 'Enroll, profiles, records' },
  { label: 'User Management',           path: '/faculty',     icon: '👨‍🏫', desc: 'Faculty profiles, assignments' },
  { label: 'HR & Payroll Module',        path: '/hr/employees',icon: '💼', desc: 'Employees, payroll, leaves' },
  { label: 'Attendance Module',          path: '/attendance',  icon: '📋', desc: 'Student attendance tracking' },
  { label: 'Academic Module',            path: '/academics',   icon: '📚', desc: 'Subjects, curriculum, calendar' },
  { label: 'Timetable Module',           path: '/timetable',   icon: '🗓️', desc: 'Class schedules, periods' },
  { label: 'Examination Module',         path: '/examination', icon: '📝', desc: 'Exams, results, grades' },
  { label: 'Fee Management Module',      path: '/fees',        icon: '💰', desc: 'Fee collection, structures' },
  { label: 'Library Management',         path: '/library',     icon: '📖', desc: 'Books, issues, returns' },
  { label: 'Hostel Management',          path: '/hostel',      icon: '🏠', desc: 'Rooms, allotments, complaints' },
  { label: 'Transport Management',       path: '/transport',   icon: '🚌', desc: 'Routes, vehicles, allotments' },
  { label: 'Placement Management',       path: '/placement',   icon: '🏢', desc: 'Companies, drives, applications' },
  { label: 'Alumni Management',          path: '/alumni',      icon: '🎖️', desc: 'Alumni profiles, events' },
  { label: 'Notification Module',        path: '/notifications',icon: '🔔', desc: 'Announcements, broadcasts' },
  { label: 'Reports & Analytics',        path: '/reports',     icon: '📈', desc: 'Institution-wide analytics' },
  { label: 'Settings & Access Control',  path: '/settings',    icon: '⚙️', desc: 'Users, roles, system config' },
]

export default function AdminPanel() {
  const navigate = useNavigate()
  const { user } = useAuth()

  return (
    <div className="page-container">
      <div className="page-header">
        <div>
          <h1 className="page-title">
            {user?.role === 'super_admin' ? '👑 Super Admin Panel' : '🛡️ Admin Panel'}
          </h1>
          <p className="page-subtitle">College ERP System — Full Module Overview</p>
        </div>
        <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', textAlign: 'right' }}>
          <div style={{ fontWeight: 600, color: 'var(--text)' }}>Logged in as</div>
          <div>{user?.username} · <span style={{ textTransform: 'capitalize', color: 'var(--primary)' }}>{user?.role?.replace('_', ' ')}</span></div>
        </div>
      </div>

      {/* Module Cards Grid */}
      <p style={{ fontWeight: 700, marginBottom: '0.75rem', fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--text-muted)' }}>Quick Access</p>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '1rem' }}>
        {MODULE_TREE.filter(m => m.path).map(m => (
          <div key={m.label} className="card" style={{ cursor: 'pointer', transition: 'transform 0.15s, box-shadow 0.15s' }}
            onClick={() => navigate(m.path)}
            onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 8px 24px rgba(0,0,0,0.12)' }}
            onMouseLeave={e => { e.currentTarget.style.transform = ''; e.currentTarget.style.boxShadow = '' }}>
            <div className="card-body" style={{ textAlign: 'center', padding: '1.25rem 1rem' }}>
              <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>{m.icon}</div>
              <div style={{ fontWeight: 600, fontSize: '0.85rem', marginBottom: '0.25rem' }}>{m.label.replace(' Module', '').replace(' Management', '')}</div>
              <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>{m.desc}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
