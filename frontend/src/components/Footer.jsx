export default function Footer() {
  return (
    <footer className="footer">
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8 }}>
        <span>© {new Date().getFullYear()} <strong>CollegeMS</strong> — College Management System</span>
        <span style={{ display: 'flex', gap: 16 }}>
          <span>v2.0.0</span>
          <span>Built with React + Django</span>
        </span>
      </div>
    </footer>
  )
}
