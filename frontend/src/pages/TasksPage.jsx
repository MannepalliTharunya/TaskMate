import React, { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getTasks, updateTask, deleteTask } from '../services/taskService';
import StatusBadge from '../components/StatusBadge';
import Pagination from '../components/Pagination';

export default function TasksPage() {
  const { isAdmin } = useAuth();
  const [tasks, setTasks] = useState([]);
  const [count, setCount] = useState(0);
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [updatingId, setUpdatingId] = useState(null);

  const fetchTasks = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const params = { page };
      if (statusFilter) params.status = statusFilter;
      const { data } = await getTasks(params);
      setTasks(data.results || []);
      setCount(data.count || 0);
    } catch {
      setError('Failed to load tasks.');
    } finally {
      setLoading(false);
    }
  }, [page, statusFilter]);

  useEffect(() => { fetchTasks(); }, [fetchTasks]);

  const handleStatusToggle = async (task) => {
    const newStatus = task.status === 'pending' ? 'completed' : 'pending';
    setUpdatingId(task.id);
    try {
      await updateTask(task.id, { status: newStatus });
      setTasks((prev) => prev.map((t) => t.id === task.id ? { ...t, status: newStatus } : t));
    } catch {
      setError('Failed to update task status.');
    } finally {
      setUpdatingId(null);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this task?')) return;
    try {
      await deleteTask(id);
      fetchTasks();
    } catch {
      setError('Failed to delete task.');
    }
  };

  return (
    <div>
      <div className="page-header">
        <div>
          <h2 className="page-title">Tasks</h2>
          <p className="page-subtitle">{count} task{count !== 1 ? 's' : ''} total</p>
        </div>
        {isAdmin && <Link to="/tasks/create" className="btn btn-primary">+ New Task</Link>}
      </div>

      {error && <div className="alert alert-error">{error}</div>}

      <div className="filter-bar">
        <select
          className="form-control"
          value={statusFilter}
          onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
          style={{ width: 160 }}
        >
          <option value="">All statuses</option>
          <option value="pending">Pending</option>
          <option value="completed">Completed</option>
        </select>
        {statusFilter && (
          <button className="btn btn-secondary btn-sm" onClick={() => { setStatusFilter(''); setPage(1); }}>
            Clear filter
          </button>
        )}
      </div>

      <div className="card">
        {loading ? (
          <div className="loading-center"><div className="spinner spinner-lg" /></div>
        ) : tasks.length === 0 ? (
          <div className="empty-state">
            <p>No tasks found{statusFilter ? ` with status "${statusFilter}"` : ''}.</p>
          </div>
        ) : (
          <div className="table-wrapper">
            <table>
              <thead>
                <tr>
                  <th>#</th>
                  <th>Title</th>
                  <th>Status</th>
                  <th>Assigned To</th>
                  <th>Due Date</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {tasks.map((task) => (
                  <tr key={task.id}>
                    <td style={{ color: 'var(--gray-400)', fontSize: 12 }}>{task.id}</td>
                    <td>
                      <div style={{ fontWeight: 500 }}>{task.title}</div>
                      {task.description && (
                        <div style={{ fontSize: 12, color: 'var(--gray-400)', marginTop: 2 }}>
                          {task.description.slice(0, 60)}{task.description.length > 60 ? '…' : ''}
                        </div>
                      )}
                    </td>
                    <td><StatusBadge status={task.status} /></td>
                    <td>{task.assigned_to?.username || '—'}</td>
                    <td>{task.due_date || '—'}</td>
                    <td>
                      <div style={{ display: 'flex', gap: 6 }}>
                        <button
                          className="btn btn-secondary btn-sm"
                          onClick={() => handleStatusToggle(task)}
                          disabled={updatingId === task.id}
                        >
                          {updatingId === task.id
                            ? <span className="spinner" />
                            : task.status === 'pending' ? 'Mark done' : 'Reopen'}
                        </button>
                        {isAdmin && (
                          <button
                            className="btn btn-danger btn-sm"
                            onClick={() => handleDelete(task.id)}
                          >
                            Delete
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        <Pagination count={count} current={page} onChange={setPage} />
      </div>
    </div>
  );
}
