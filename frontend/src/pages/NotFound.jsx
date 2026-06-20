import { Link } from 'react-router-dom'

export default function NotFound() {
  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg)' }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{ fontSize: 80, fontWeight: 700, color: 'var(--border)' }}>404</div>
        <h2 style={{ fontSize: 20, marginBottom: 8 }}>Page Not Found</h2>
        <p style={{ color: 'var(--text-muted)', marginBottom: 20 }}>The page you're looking for doesn't exist.</p>
        <Link to="/dashboard" className="btn btn-primary">Go to Dashboard</Link>
      </div>
    </div>
  )
}
