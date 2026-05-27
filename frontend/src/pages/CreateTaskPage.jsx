import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { createTask } from '../services/taskService';

export default function CreateTaskPage() {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    title: '', description: '', assigned_to: '', due_date: '',
  });
  const [errors, setErrors] = useState({});
  const [apiError, setApiError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  const validate = () => {
    const e = {};
    if (!form.title.trim()) e.title = 'Title is required';
    return e;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length) { setErrors(errs); return; }
    setErrors({});
    setApiError('');
    setLoading(true);
    try {
      const payload = { title: form.title, description: form.description };
      if (form.assigned_to) payload.assigned_to = parseInt(form.assigned_to, 10);
      if (form.due_date) payload.due_date = form.due_date;
      await createTask(payload);
      setSuccess('Task created successfully!');
      setTimeout(() => navigate('/tasks'), 1200);
    } catch (err) {
      const data = err.response?.data;
      if (data && typeof data === 'object') {
        const msgs = Object.entries(data).map(([k, v]) => `${k}: ${Array.isArray(v) ? v[0] : v}`);
        setApiError(msgs.join(' | '));
      } else {
        setApiError('Failed to create task.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: 600 }}>
      <div className="page-header">
        <div>
          <h2 className="page-title">Create Task</h2>
          <p className="page-subtitle">Assign a new task to a team member.</p>
        </div>
      </div>

      <div className="card">
        <div className="card-body">
          {apiError && <div className="alert alert-error">{apiError}</div>}
          {success && <div className="alert alert-success">{success}</div>}

          <form onSubmit={handleSubmit} noValidate>
            <div className="form-group">
              <label className="form-label">Title *</label>
              <input
                className={`form-control${errors.title ? ' error' : ''}`}
                placeholder="Task title"
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
              />
              {errors.title && <p className="form-error">{errors.title}</p>}
            </div>

            <div className="form-group">
              <label className="form-label">Description</label>
              <textarea
                className="form-control"
                rows={4}
                placeholder="Describe the task..."
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Assign To (User ID)</label>
              <input
                className="form-control"
                type="number"
                placeholder="Enter user ID"
                value={form.assigned_to}
                onChange={(e) => setForm({ ...form, assigned_to: e.target.value })}
              />
              <p style={{ fontSize: 12, color: 'var(--gray-400)', marginTop: 4 }}>
                Enter the numeric ID of the user to assign this task to.
              </p>
            </div>

            <div className="form-group">
              <label className="form-label">Due Date</label>
              <input
                className="form-control"
                type="date"
                value={form.due_date}
                onChange={(e) => setForm({ ...form, due_date: e.target.value })}
              />
            </div>

            <div style={{ display: 'flex', gap: 10, marginTop: 8 }}>
              <button type="submit" className="btn btn-primary" disabled={loading}>
                {loading ? <><span className="spinner" /> Creating...</> : 'Create Task'}
              </button>
              <button type="button" className="btn btn-secondary" onClick={() => navigate('/tasks')}>
                Cancel
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
