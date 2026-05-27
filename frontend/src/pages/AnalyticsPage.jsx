import React, { useEffect, useState } from 'react';
import { getAnalytics } from '../services/analyticsService';

const ACTION_LABELS = {
  login: 'Login',
  task_create: 'Task Created',
  task_update: 'Task Updated',
  document_upload: 'Doc Uploaded',
  search: 'Search',
};

const ACTION_COLORS = {
  login: '#6366f1',
  task_create: '#10b981',
  task_update: '#f59e0b',
  document_upload: '#8b5cf6',
  search: '#ef4444',
};

function StatCard({ label, value, sub, colorClass, icon }) {
  return (
    <div className="stat-card">
      <div className={`stat-icon ${colorClass}`}>
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none"
          stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d={icon} />
        </svg>
      </div>
      <div>
        <div className="stat-value">{value ?? '—'}</div>
        <div className="stat-label">{label}</div>
        {sub && <div style={{ fontSize: 11, color: 'var(--gray-400)', marginTop: 2 }}>{sub}</div>}
      </div>
    </div>
  );
}

function ProgressBar({ value, max, color }) {
  const pct = max > 0 ? Math.round((value / max) * 100) : 0;
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
      <div style={{ flex: 1, background: 'var(--gray-100)', borderRadius: 6, height: 8, overflow: 'hidden' }}>
        <div style={{ width: `${pct}%`, height: '100%', background: color, borderRadius: 6, transition: 'width .4s ease' }} />
      </div>
      <span style={{ fontSize: 12, color: 'var(--gray-500)', width: 36, textAlign: 'right' }}>{pct}%</span>
    </div>
  );
}

export default function AnalyticsPage() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    getAnalytics()
      .then(({ data }) => setData(data))
      .catch(() => setError('Failed to load analytics. Make sure you are logged in as Admin.'))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return (
    <div className="loading-center">
      <div className="spinner spinner-lg" />
      <p>Loading analytics...</p>
    </div>
  );

  if (error) return <div className="alert alert-error">{error}</div>;

  const { tasks, documents, searches, users, activity_breakdown, recent_activity } = data;

  return (
    <div>
      <div className="page-header">
        <div>
          <h2 className="page-title">Analytics</h2>
          <p className="page-subtitle">System-wide overview — Admin only</p>
        </div>
      </div>

      {/* ── Task Stats ── */}
      <p style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.8px', color: 'var(--gray-400)', marginBottom: 10 }}>Tasks</p>
      <div className="stats-grid" style={{ marginBottom: 24 }}>
        <StatCard label="Total Tasks" value={tasks.total} colorClass="purple"
          icon="M9 11l3 3L22 4 M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11" />
        <StatCard label="Pending" value={tasks.pending} colorClass="yellow"
          sub={`${tasks.total ? Math.round(tasks.pending / tasks.total * 100) : 0}% of total`}
          icon="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10" />
        <StatCard label="Completed" value={tasks.completed} colorClass="green"
          sub={`${tasks.completion_rate}% completion rate`}
          icon="M22 11.08V12a10 10 0 11-5.93-9.14 M22 4L12 14.01l-3-3" />
        <StatCard label="Active Users" value={users.total} colorClass="purple"
          icon="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2 M23 21v-2a4 4 0 00-3-3.87 M16 3.13a4 4 0 010 7.75" />
      </div>

      {/* ── Task Completion Bar ── */}
      <div className="card" style={{ marginBottom: 24 }}>
        <div className="card-header">
          <span className="card-title">Task Completion Breakdown</span>
          <span style={{ fontSize: 13, color: 'var(--gray-400)' }}>{tasks.total} total</span>
        </div>
        <div className="card-body">
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                <span style={{ fontSize: 13, fontWeight: 500, color: 'var(--gray-600)' }}>✓ Completed</span>
                <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--success)' }}>{tasks.completed}</span>
              </div>
              <ProgressBar value={tasks.completed} max={tasks.total} color="var(--success)" />
            </div>
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                <span style={{ fontSize: 13, fontWeight: 500, color: 'var(--gray-600)' }}>⏳ Pending</span>
                <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--warning)' }}>{tasks.pending}</span>
              </div>
              <ProgressBar value={tasks.pending} max={tasks.total} color="var(--warning)" />
            </div>
          </div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 24 }}>

        {/* ── Most Searched Queries ── */}
        <div className="card">
          <div className="card-header">
            <span className="card-title">🔍 Most Searched Queries</span>
            <span style={{ fontSize: 12, color: 'var(--gray-400)' }}>{searches.total} total searches</span>
          </div>
          <div className="card-body" style={{ padding: '12px 20px' }}>
            {searches.top_queries.length === 0 ? (
              <div className="empty-state" style={{ padding: '24px 0' }}>
                <p>No searches yet.</p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {searches.top_queries.map((q, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <span style={{
                      width: 22, height: 22, borderRadius: '50%', background: 'var(--primary-light)',
                      color: 'var(--primary)', fontSize: 11, fontWeight: 700,
                      display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                    }}>{i + 1}</span>
                    <div style={{ flex: 1, overflow: 'hidden' }}>
                      <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--gray-700)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {q.query}
                      </div>
                      <ProgressBar value={q.count} max={searches.top_queries[0]?.count || 1} color="var(--primary)" />
                    </div>
                    <span style={{
                      fontSize: 12, fontWeight: 600, color: 'var(--primary)',
                      background: 'var(--primary-light)', padding: '2px 8px', borderRadius: 20, flexShrink: 0,
                    }}>{q.count}x</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* ── Activity Breakdown ── */}
        <div className="card">
          <div className="card-header">
            <span className="card-title">📊 Activity Breakdown</span>
          </div>
          <div className="card-body" style={{ padding: '12px 20px' }}>
            {Object.keys(activity_breakdown).length === 0 ? (
              <div className="empty-state" style={{ padding: '24px 0' }}><p>No activity yet.</p></div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {Object.entries(activity_breakdown).map(([action, count]) => {
                  const total = Object.values(activity_breakdown).reduce((a, b) => a + b, 0);
                  return (
                    <div key={action}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5 }}>
                        <span style={{ fontSize: 13, fontWeight: 500, color: 'var(--gray-600)' }}>
                          {ACTION_LABELS[action] || action}
                        </span>
                        <span style={{ fontSize: 12, fontWeight: 600, color: ACTION_COLORS[action] || 'var(--gray-500)' }}>
                          {count}
                        </span>
                      </div>
                      <ProgressBar value={count} max={total} color={ACTION_COLORS[action] || 'var(--gray-400)'} />
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── Document Stats ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, marginBottom: 24 }}>
        <StatCard label="Total Documents" value={documents.total} colorClass="purple"
          icon="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z M14 2v6h6" />
        <StatCard label="FAISS Indexed" value={documents.indexed} colorClass="green"
          sub="Ready for AI search"
          icon="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0" />
        <StatCard label="Total Searches" value={searches.total} colorClass="red"
          icon="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0" />
      </div>

      {/* ── Recent Activity ── */}
      <div className="card">
        <div className="card-header">
          <span className="card-title">Recent Activity</span>
          <span style={{ fontSize: 12, color: 'var(--gray-400)' }}>Last 10 events</span>
        </div>
        <div className="table-wrapper">
          {recent_activity.length === 0 ? (
            <div className="empty-state"><p>No activity recorded yet.</p></div>
          ) : (
            <table>
              <thead>
                <tr>
                  <th>User</th>
                  <th>Action</th>
                  <th>Detail</th>
                  <th>Time</th>
                </tr>
              </thead>
              <tbody>
                {recent_activity.map((log, i) => (
                  <tr key={i}>
                    <td style={{ fontWeight: 500 }}>{log.user}</td>
                    <td>
                      <span style={{
                        padding: '2px 8px', borderRadius: 20, fontSize: 11.5, fontWeight: 600,
                        background: `${ACTION_COLORS[log.action]}20`,
                        color: ACTION_COLORS[log.action] || 'var(--gray-600)',
                      }}>
                        {ACTION_LABELS[log.action] || log.action}
                      </span>
                    </td>
                    <td style={{ color: 'var(--gray-500)', maxWidth: 260, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {log.detail || '—'}
                    </td>
                    <td style={{ color: 'var(--gray-400)', fontSize: 12, whiteSpace: 'nowrap' }}>
                      {new Date(log.created_at).toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}
