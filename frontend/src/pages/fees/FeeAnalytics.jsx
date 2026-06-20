import { useEffect, useState } from 'react'
import api from '../../api/axios'
import Loader from '../../components/Loader'
import { formatCurrency, formatDate } from '../../utils/helpers'
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from 'recharts'

const KPI = ({ label, value, sub, color, icon }) => (
  <div className="stat-card" style={{ borderTop: `3px solid ${color}` }}>
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
      <div>
        <div className="stat-value" style={{ color }}>{value}</div>
        <div className="stat-label">{label}</div>
        {sub && <div className="stat-sub">{sub}</div>}
      </div>
      <div style={{ fontSize: 28 }}>{icon}</div>
    </div>
  </div>
)

export default function FeeAnalytics() {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.get('/fees/analytics/').then(r => setData(r.data)).finally(() => setLoading(false))
  }, [])

  if (loading) return <Loader />
  if (!data) return <div className="empty-state"><p>Failed to load analytics.</p></div>

  const { summary, monthly_collection, fee_type_breakdown, status_breakdown, department_wise, upcoming_dues } = data

  const feeTypeColors = ['#2563eb', '#7c3aed', '#059669', '#d97706', '#dc2626', '#0891b2', '#16a34a', '#6b7280']

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      <div className="page-header" style={{ marginBottom: 0 }}>
        <div><h1>Fee Analytics</h1><p>Department-wise collection insights & KPIs</p></div>
        <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>
          Academic Year: <strong>2024-25</strong>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="stats-grid">
        <KPI label="Total Fees Billed" value={formatCurrency(summary.total_fees)} icon="💰" color="#2563eb" sub="All records" />
        <KPI label="Total Collected" value={formatCurrency(summary.total_paid)} icon="✅" color="#22c55e" sub={`${summary.paid_count} paid`} />
        <KPI label="Pending Amount" value={formatCurrency(summary.total_pending)} icon="⏳" color="#f59e0b" sub={`${summary.pending_count} records`} />
        <KPI label="Overdue Amount" value={formatCurrency(summary.total_overdue)} icon="🚨" color="#ef4444" sub={`${summary.overdue_count} records`} />
        <KPI label="Collection Rate" value={`${summary.collection_rate}%`} icon="📈" color="#7c3aed" sub="Paid vs total" />
        <KPI label="Total Discounts" value={formatCurrency(summary.total_discount)} icon="🎓" color="#059669" sub="Scholarships applied" />
        <KPI label="Total Fines" value={formatCurrency(summary.total_fine)} icon="⚠️" color="#dc2626" sub="Penalties collected" />
      </div>

      {/* Collection Rate Bar */}
      <div className="card">
        <div className="card-body" style={{ padding: '16px 20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
            <span style={{ fontWeight: 600, fontSize: 14 }}>Overall Collection Rate</span>
            <span style={{ fontWeight: 700, color: '#22c55e' }}>{summary.collection_rate}%</span>
          </div>
          <div style={{ background: '#f3f4f6', borderRadius: 999, height: 12, overflow: 'hidden' }}>
            <div style={{
              width: `${summary.collection_rate}%`, height: '100%', borderRadius: 999,
              background: 'linear-gradient(90deg, #22c55e, #16a34a)', transition: 'width 0.6s ease'
            }} />
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 6, fontSize: 12, color: 'var(--text-muted)' }}>
            <span>₹0</span><span>{formatCurrency(summary.total_fees)}</span>
          </div>
        </div>
      </div>

      {/* Monthly Collection Chart */}
      <div className="card">
        <div className="card-header">
          <h3>📅 Monthly Collection — {new Date().getFullYear()}</h3>
          <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>Paid fees by month</span>
        </div>
        <div className="card-body">
          {monthly_collection.length === 0 ? (
            <div className="empty-state" style={{ padding: 40 }}><p>No payment data for this year yet.</p></div>
          ) : (
            <ResponsiveContainer width="100%" height={240}>
              <AreaChart data={monthly_collection} margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="collGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#2563eb" stopOpacity={0.15} />
                    <stop offset="95%" stopColor="#2563eb" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} tickFormatter={v => `₹${(v / 1000).toFixed(0)}k`} />
                <Tooltip formatter={v => formatCurrency(v)} contentStyle={{ borderRadius: 8, fontSize: 13 }} />
                <Area type="monotone" dataKey="collected" stroke="#2563eb" strokeWidth={2} fill="url(#collGrad)" name="Collected" />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* Fee Type Breakdown + Status Pie */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        {/* Fee Type Bar */}
        <div className="card">
          <div className="card-header">
            <h3>🗂 Fee Type Breakdown</h3>
            <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>Amount by category</span>
          </div>
          <div className="card-body">
            {fee_type_breakdown.length === 0 ? (
              <div className="empty-state" style={{ padding: 40 }}><p>No data yet.</p></div>
            ) : (
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={fee_type_breakdown} margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="fee_type" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} tickFormatter={v => `₹${(v / 1000).toFixed(0)}k`} />
                  <Tooltip formatter={v => formatCurrency(v)} contentStyle={{ borderRadius: 8, fontSize: 13 }} />
                  <Bar dataKey="total" name="Total" radius={[4, 4, 0, 0]}>
                    {fee_type_breakdown.map((_, i) => (
                      <Cell key={i} fill={feeTypeColors[i % feeTypeColors.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Status Pie */}
        <div className="card">
          <div className="card-header">
            <h3>📊 Payment Status</h3>
            <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>Distribution by status</span>
          </div>
          <div className="card-body" style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <ResponsiveContainer width="60%" height={200}>
              <PieChart>
                <Pie data={status_breakdown} cx="50%" cy="50%" innerRadius={50} outerRadius={80}
                  dataKey="value" paddingAngle={3}>
                  {status_breakdown.map((entry, i) => (
                    <Cell key={i} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip formatter={v => `${v} records`} contentStyle={{ borderRadius: 8, fontSize: 13 }} />
              </PieChart>
            </ResponsiveContainer>
            <div style={{ flex: 1 }}>
              {status_breakdown.map(s => (
                <div key={s.name} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
                  <div style={{ width: 12, height: 12, borderRadius: 3, background: s.color, flexShrink: 0 }} />
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 600, fontSize: 13 }}>{s.name}</div>
                    <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{s.value} records</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Department-wise Collection */}
      {department_wise.length > 0 && (
        <div className="card">
          <div className="card-header">
            <h3>🏛 Department / Course-wise Collection</h3>
            <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>Paid vs Pending per course</span>
          </div>
          <div className="card-body">
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={department_wise} margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="department" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} tickFormatter={v => `₹${(v / 1000).toFixed(0)}k`} />
                <Tooltip formatter={v => formatCurrency(v)} contentStyle={{ borderRadius: 8, fontSize: 13 }} />
                <Legend />
                <Bar dataKey="paid" name="Paid" fill="#22c55e" radius={[4, 4, 0, 0]} />
                <Bar dataKey="pending" name="Pending" fill="#f59e0b" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Upcoming Dues */}
      {upcoming_dues.length > 0 && (
        <div className="card">
          <div className="card-header">
            <h3>⏰ Upcoming Dues — Next 7 Days</h3>
            <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>{upcoming_dues.length} records</span>
          </div>
          <div className="table-wrap">
            <table>
              <thead>
                <tr><th>Student</th><th>Fee Type</th><th>Amount</th><th>Due Date</th><th>Status</th></tr>
              </thead>
              <tbody>
                {upcoming_dues.map(f => (
                  <tr key={f.id}>
                    <td style={{ fontWeight: 500 }}>{f.student}</td>
                    <td>{f.fee_type}</td>
                    <td style={{ fontWeight: 600 }}>{formatCurrency(f.amount)}</td>
                    <td>{formatDate(f.due_date)}</td>
                    <td>
                      <span className={`badge ${f.status === 'overdue' ? 'badge-danger' : 'badge-warning'}`}>
                        {f.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
