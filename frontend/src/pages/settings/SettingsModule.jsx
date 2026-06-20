import UserManagement from '../users/UserManagement'

const CONFIG_CARDS = [
  { icon: '👥', label: 'User Management', desc: 'Create users, assign roles, set passwords', color: '#2563eb' },
  { icon: '🔐', label: 'Role & Permissions', desc: 'Control module access per role', color: '#7c3aed' },
  { icon: '🏫', label: 'Institution Info', desc: 'College name, logo, contact details', color: '#059669' },
]

export default function SettingsModule() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      <div className="page-header" style={{ marginBottom: 0 }}>
        <div><h1>Settings &amp; Access Control</h1><p>System configuration, user roles &amp; permissions</p></div>
      </div>

      <div className="kpi-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))' }}>
        {CONFIG_CARDS.map(item => (
          <div key={item.label} className="kpi-card" style={{ '--kpi-color': item.color, cursor: 'default' }}>
            <div className="kpi-icon" style={{ fontSize: 24 }}>{item.icon}</div>
            <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 4 }}>{item.label}</div>
            <div style={{ fontSize: 12, color: 'var(--text-muted)', lineHeight: 1.5 }}>{item.desc}</div>
          </div>
        ))}
      </div>

      <UserManagement />
    </div>
  )
}
