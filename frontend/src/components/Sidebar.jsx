import { NavLink, useNavigate } from 'react-router-dom'
import { useState } from 'react'
import useAuth from '../hooks/useAuth'

const Icon = ({ d, size = 17 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d={d} />
  </svg>
)

const ROLE_LABELS = {
  super_admin: 'Super Admin', admin: 'Admin', faculty: 'Faculty',
  student: 'Student', hr: 'HR', accountant: 'Accountant',
  librarian: 'Librarian', hostel_warden: 'Hostel Warden',
  placement_officer: 'Placement Officer', transport_incharge: 'Transport Incharge',
  alumni_coordinator: 'Alumni Coordinator', parent: 'Parent',
}

const ICONS = {
  dashboard:    'M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z M9 22V12h6v10',
  students:     'M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2 M9 11a4 4 0 100-8 4 4 0 000 8z M23 21v-2a4 4 0 00-3-3.87 M16 3.13a4 4 0 010 7.75',
  faculty:      'M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2 M12 11a4 4 0 100-8 4 4 0 000 8z',
  hr:           'M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2 M9 11a4 4 0 100-8 4 4 0 000 8z M23 21v-2a4 4 0 00-3-3.87 M16 3.13a4 4 0 010 7.75',
  attendance:   'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4',
  academics:    'M12 14l9-5-9-5-9 5 9 5z M12 14l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z',
  timetable:    'M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z',
  examination:  'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2M9 12h6M9 16h4',
  fees:         'M12 1v22 M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6',
  library:      'M4 19.5A2.5 2.5 0 016.5 17H20 M6.5 2H20v20H6.5A2.5 2.5 0 014 19.5v-15A2.5 2.5 0 016.5 2z',
  hostel:       'M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z',
  transport:    'M8 6v6m0 0v6m0-6h12M8 12H4',
  placement:    'M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z',
  alumni:       'M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z',
  notifications:'M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9',
  reports:      'M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z',
  settings:     'M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z M15 12a3 3 0 11-6 0 3 3 0 016 0z',
  payroll:      'M12 1v22 M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6',
  leaves:       'M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z',
  profile:      'M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2 M12 11a4 4 0 100-8 4 4 0 000 8z',
  admin:        'M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z',
  logout:       'M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4 M16 17l5-5-5-5 M21 12H9',
}

function NavGroup({ label, icon, children, defaultOpen = false }) {
  const [open, setOpen] = useState(defaultOpen)
  return (
    <div className="nav-group">
      <button className="nav-group-toggle" onClick={() => setOpen(o => !o)}>
        <span className="nav-group-label">{label}</span>
        <svg className={`nav-group-chevron ${open ? 'open' : ''}`} width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
          <path d="M6 9l6 6 6-6" />
        </svg>
      </button>
      {open && <div className="nav-group-items">{children}</div>}
    </div>
  )
}

export default function Sidebar({ open }) {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const role = user?.role

  const handleLogout = () => { logout(); navigate('/login') }

  const link = (to, iconKey, label) => (
    <NavLink to={to} className={({ isActive }) => `nav-item${isActive ? ' active' : ''}`}>
      <Icon d={ICONS[iconKey] || ICONS.dashboard} />
      <span>{label}</span>
    </NavLink>
  )

  const is         = (...roles) => roles.includes(role)
  const isSuper    = is('super_admin')
  const isAdmin    = is('super_admin', 'admin')
  const isHR       = is('super_admin', 'admin', 'hr')
  const isFinance  = is('super_admin', 'admin', 'accountant')
  const isAcademic = is('super_admin', 'admin', 'faculty')
  const isHostel   = is('super_admin', 'admin', 'hostel_warden')
  const isLibrary  = is('super_admin', 'admin', 'librarian')
  const isPlace    = is('super_admin', 'admin', 'placement_officer')
  const isTrans    = is('super_admin', 'admin', 'transport_incharge')
  const isAlumni   = is('super_admin', 'admin', 'alumni_coordinator')

  const initials = user?.username?.[0]?.toUpperCase()

  return (
    <aside className={`sidebar ${open ? 'open' : ''}`}>
      {/* Logo */}
      <div className="sidebar-logo">
        <div className="sidebar-logo-icon">🎓</div>
        <div>
          <div className="sidebar-logo-name">CollegeMS</div>
          <div className="sidebar-logo-role">{ROLE_LABELS[role] || 'ERP System'}</div>
        </div>
      </div>

      {/* Nav */}
      <nav className="sidebar-nav">

        {/* Main */}
        <div className="nav-section">
          <div className="nav-label">Main</div>
          {link('/dashboard', 'dashboard', 'Dashboard')}
        </div>

        {/* Admin */}
        {isAdmin && (
          <div className="nav-section">
            <div className="nav-label">{isSuper ? 'Super Admin' : 'Admin'}</div>
            {link('/admin-panel', 'admin', isSuper ? 'Super Admin Panel' : 'Admin Panel')}
          </div>
        )}

        {/* Student self-service */}
        {is('student') && (
          <div className="nav-section">
            <div className="nav-label">My Account</div>
            {link('/my-profile', 'profile', 'My Profile')}
            {link('/fees/pay', 'fees', 'My Fees')}
          </div>
        )}

        {/* Parent self-service */}
        {is('parent') && (
          <div className="nav-section">
            <div className="nav-label">My Account</div>
            {link('/parent-portal', 'dashboard', 'Parent Portal')}
          </div>
        )}

        {/* Academic */}
        {isAcademic && (
          <NavGroup label="Academics" defaultOpen>
            {link('/students', 'students', 'Students')}
            {link('/attendance', 'attendance', 'Attendance')}
            {link('/academics', 'academics', 'Subjects & Calendar')}
            {link('/timetable', 'timetable', 'Timetable')}
            {link('/examination', 'examination', 'Exams & Results')}
          </NavGroup>
        )}

        {/* Faculty */}
        {isHR && (
          <NavGroup label="Faculty">
            {link('/faculty', 'faculty', 'Faculty List')}
          </NavGroup>
        )}

        {/* HR */}
        {isHR && (
          <NavGroup label="HR & Payroll">
            {link('/hr/employees', 'hr', 'Employees')}
            {link('/hr/attendance', 'attendance', 'HR Attendance')}
            {link('/hr/leaves', 'leaves', 'Leave Requests')}
            {link('/hr/payroll', 'payroll', 'Payroll')}
            {link('/hr/reports', 'reports', 'HR Reports')}
          </NavGroup>
        )}

        {/* Finance */}
        {isFinance && (
          <NavGroup label="Fee Management">
            {link('/fees', 'fees', 'Fee Records')}
            {link('/fees/structure', 'academics', 'Fee Structure')}
            {link('/fees/history', 'reports', 'Payment History')}
          </NavGroup>
        )}

        {/* Library */}
        {isLibrary && (
          <NavGroup label="Library">
            {link('/library', 'library', 'Library')}
          </NavGroup>
        )}

        {/* Hostel */}
        {isHostel && (
          <NavGroup label="Hostel">
            {link('/hostel', 'hostel', 'Dashboard')}
            {link('/hostel/applications', 'students', 'Applications')}
            {link('/hostel/rooms', 'hostel', 'Rooms')}
            {link('/hostel/allotments', 'faculty', 'Allotments')}
            {link('/hostel/attendance', 'attendance', 'Attendance')}
            {link('/hostel/fees', 'fees', 'Fees')}
            {link('/hostel/leaves', 'leaves', 'Leave Requests')}
            {link('/hostel/visitors', 'alumni', 'Visitors')}
            {link('/hostel/complaints', 'notifications', 'Complaints')}
            {link('/hostel/reports', 'reports', 'Reports')}
          </NavGroup>
        )}

        {/* Transport */}
        {isTrans && (
          <NavGroup label="Transport">
            {link('/transport', 'transport', 'Transport')}
          </NavGroup>
        )}

        {/* Placement */}
        {isPlace && (
          <NavGroup label="Placement">
            {link('/placement', 'placement', 'Placement')}
          </NavGroup>
        )}

        {/* Alumni */}
        {isAlumni && (
          <NavGroup label="Alumni">
            {link('/alumni', 'alumni', 'Alumni')}
          </NavGroup>
        )}

        {/* Admin tools */}
        {isAdmin && (
          <NavGroup label="Administration">
            {link('/users', 'admin', 'Users & Roles')}
            {link('/notifications', 'notifications', 'Notifications')}
            {link('/reports', 'reports', 'Reports & Analytics')}
            {isSuper && link('/settings', 'settings', 'Settings')}
          </NavGroup>
        )}

      </nav>

      {/* Footer */}
      <div className="sidebar-footer">
        <div className="sidebar-user">
          <div className="user-avatar">{initials}</div>
          <div className="sidebar-user-info">
            <div className="user-name">{user?.username}</div>
            <div className="user-role">{ROLE_LABELS[role] || role}</div>
          </div>
          <button onClick={handleLogout} className="sidebar-logout-btn" title="Logout">
            <Icon d={ICONS.logout} size={15} />
          </button>
        </div>
      </div>
    </aside>
  )
}
