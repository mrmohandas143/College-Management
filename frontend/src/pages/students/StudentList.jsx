import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { getStudents, deleteStudent } from '../../services/studentService'
import { getFaculty } from '../../services/facultyService'
import Loader from '../../components/Loader'
import useAuth from '../../hooks/useAuth'
import { formatDate, statusBadge, initials } from '../../utils/helpers'

function ActionMenu({ studentId, name, canEdit, canDelete, onDelete, navigate }) {
  const [open, setOpen] = useState(false)
  return (
    <div style={{ position: 'relative', display: 'inline-block' }}>
      <button onClick={() => setOpen(o => !o)} className="btn btn-outline btn-sm" style={{ padding: '4px 10px', fontSize: 18, lineHeight: 1 }}>⋮</button>
      {open && (
        <>
          <div onClick={() => setOpen(false)} style={{ position: 'fixed', inset: 0, zIndex: 10 }} />
          <div style={{ position: 'absolute', right: 0, top: '110%', zIndex: 20, background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 8, boxShadow: '0 4px 16px rgba(0,0,0,0.12)', minWidth: 130, overflow: 'hidden' }}>
            <button onClick={() => { setOpen(false); navigate(`/students/${studentId}`) }} style={{ display: 'flex', alignItems: 'center', gap: 8, width: '100%', padding: '9px 14px', background: 'none', border: 'none', cursor: 'pointer', fontSize: 13, color: 'var(--text)' }}>View</button>
            {canEdit && <button onClick={() => { setOpen(false); navigate(`/students/${studentId}/edit`) }} style={{ display: 'flex', alignItems: 'center', gap: 8, width: '100%', padding: '9px 14px', background: 'none', border: 'none', cursor: 'pointer', fontSize: 13, color: 'var(--text)' }}>Edit</button>}
            {canDelete && <button onClick={() => { setOpen(false); onDelete() }} style={{ display: 'flex', alignItems: 'center', gap: 8, width: '100%', padding: '9px 14px', background: 'none', border: 'none', cursor: 'pointer', fontSize: 13, color: 'var(--danger)' }}>Delete</button>}
          </div>
        </>
      )}
    </div>
  )
}

export default function StudentList() {
  const { user } = useAuth()
  const role = user?.role
  const navigate = useNavigate()

  // Students → own profile, Faculty → their faculty profile
  useEffect(() => {
    if (role === 'student') { navigate('/my-profile', { replace: true }); return }
    if (role === 'faculty') {
      getFaculty().then(r => {
        const match = r.data.find(f =>
          f.email === user?.username ||
          f.email?.split('@')[0] === user?.username ||
          `${f.first_name.toLowerCase()}.${f.last_name.toLowerCase()}` === user?.username?.toLowerCase()
        )
        if (match) navigate(`/faculty/${match.id}`, { replace: true })
      })
    }
  }, [role, navigate])

  const canAdd = role === 'admin' || role === 'faculty'
  const canDelete = role === 'admin' || role === 'faculty'
  const canEdit = role === 'admin'

  const [students, setStudents] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')

  const load = (q = '') => {
    setLoading(true)
    getStudents(q).then(r => setStudents(r.data)).finally(() => setLoading(false))
  }

  useEffect(() => { load() }, [])
  useEffect(() => {
    const t = setTimeout(() => load(search), 400)
    return () => clearTimeout(t)
  }, [search])

  const handleDelete = async (id, name) => {
    if (!confirm(`Delete ${name}?`)) return
    await deleteStudent(id)
    load(search)
  }

  if (role === 'student') return null

  return (
    <div>
      <div className="page-header">
        <div><h1>Students</h1><p>{students.length} total students</p></div>
        {canAdd && <Link to="/students/add" className="btn btn-primary">+ Add Student</Link>}
      </div>

      <div className="card">
        <div className="toolbar">
          <div className="search-bar">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/></svg>
            <input placeholder="Search students..." value={search} onChange={e => setSearch(e.target.value)} />
          </div>
        </div>

        {loading ? <Loader /> : students.length === 0 ? (
          <div className="empty-state">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/></svg>
            <p>No students found</p>
          </div>
        ) : (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Student</th><th>Reg No</th><th>Course</th><th>Year</th><th>CGPA</th><th>Attendance</th><th>Status</th><th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {students.map(s => (
                  <tr key={s.id}>
                    <td>
                      <div>
                        <div style={{ fontWeight: 500 }}>{s.first_name} {s.last_name}</div>
                        <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{s.email}</div>
                      </div>
                    </td>
                    <td>{s.register_number}</td>
                    <td>{s.course}</td>
                    <td>Year {s.year}</td>
                    <td>{s.cgpa != null ? Number(s.cgpa).toFixed(2) : '—'}</td>
                    <td style={{ color: s.attendance_percentage >= 75 ? 'var(--success)' : s.attendance_percentage != null ? 'var(--danger)' : 'inherit' }}>
                      {s.attendance_percentage != null ? `${Number(s.attendance_percentage).toFixed(1)}%` : '—'}
                    </td>
                    <td><span className={`badge ${statusBadge(s.status)}`}>{s.status}</span></td>
                    <td>
                      <ActionMenu
                        studentId={s.id}
                        canEdit={canEdit}
                        canDelete={canDelete}
                        onDelete={() => handleDelete(s.id, `${s.first_name} ${s.last_name}`)}
                        navigate={navigate}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
