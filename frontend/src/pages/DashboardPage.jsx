import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getTasks } from '../services/taskService';
import { getDocuments } from '../services/documentService';
import { getAnalytics } from '../services/analyticsService';
import StatusBadge from '../components/StatusBadge';

const StatCard = ({ label, value, colorClass, icon }) => (
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
    </div>
  </div>
);

export default function DashboardPage() {
  const { user, isAdmin } = useAuth();
  const [tasks, setTasks] = useState([]);
  const [analytics, setAnalytics] = useState(null);
  const [docCount, setDocCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const [taskRes, docRes] = await Promise.all([
          getTasks({ page_size: 5 }),
          getDocuments({ page_size: 1 }),
        ]);
        setTasks(taskRes.data.results || []);
        setDocCount(docRes.data.count || 0);

        if (isAdmin) {
          const anaRes = await getAnalytics();
          setAnalytics(anaRes.data);
        }
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [isAdmin]);

  const pendingCount = tasks.filter((t) => t.status === 'pending').length;
  const completedCount = tasks.filter((t) => t.status === 'completed').length;

  if (loading) {
    return <div className="loading-center"><div className="spinner spinner-lg" /><p>Loading dashboard...</p></div>;
  }

  return (
    <div>
      <div className="page-header">
        <div>
          <h2 className="page-title">Welcome back, {user?.first_name || user?.username} 👋</h2>
          <p className="page-subtitle">Here's what's happening today.</p>
        </div>
        {isAdmin && (
          <Link to="/tasks/create" className="btn btn-primary">+ New Task</Link>
        )}
      </div>

      <div className="stats-grid">
        {isAdmin && analytics ? (
          <>
            <StatCard label="Total Tasks" value={analytics.tasks.total} colorClass="purple"
              icon="M9 11l3 3L22 4 M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11" />
            <StatCard label="Pending" value={analytics.tasks.pending} colorClass="yellow"
              icon="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10" />
            <StatCard label="Completed" value={analytics.tasks.completed} colorClass="green"
              icon="M22 11.08V12a10 10 0 11-5.93-9.14 M22 4L12 14.01l-3-3" />
            <StatCard label="Documents" value={analytics.documents.total} colorClass="purple"
              icon="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z M14 2v6h6" />
            <StatCard label="Searches" value={analytics.searches.total} colorClass="red"
              icon="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0" />
          </>
        ) : (
          <>
            <StatCard label="My Tasks" value={tasks.length} colorClass="purple"
              icon="M9 11l3 3L22 4 M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11" />
            <StatCard label="Pending" value={pendingCount} colorClass="yellow"
              icon="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10" />
            <StatCard label="Completed" value={completedCount} colorClass="green"
              icon="M22 11.08V12a10 10 0 11-5.93-9.14 M22 4L12 14.01l-3-3" />
            <StatCard label="Documents" value={docCount} colorClass="purple"
              icon="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z M14 2v6h6" />
          </>
        )}
      </div>

      <div className="card">
        <div className="card-header">
          <span className="card-title">Recent Tasks</span>
          <Link to="/tasks" className="btn btn-secondary btn-sm">View all</Link>
        </div>
        <div className="table-wrapper">
          {tasks.length === 0 ? (
            <div className="empty-state"><p>No tasks yet.</p></div>
          ) : (
            <table>
              <thead>
                <tr>
                  <th>Title</th>
                  <th>Status</th>
                  <th>Assigned To</th>
                  <th>Due Date</th>
                </tr>
              </thead>
              <tbody>
                {tasks.map((task) => (
                  <tr key={task.id}>
                    <td style={{ fontWeight: 500 }}>{task.title}</td>
                    <td><StatusBadge status={task.status} /></td>
                    <td>{task.assigned_to?.username || '—'}</td>
                    <td>{task.due_date || '—'}</td>
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
