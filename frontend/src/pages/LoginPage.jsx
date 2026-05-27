import React, { useState } from 'react';
import { useNavigate, Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { login } from '../services/authService';

const CREDENTIALS = {
  admin: { email: 'admin@taskai.com', password: 'Admin@123' },
  user:  { email: 'john@taskai.com',  password: 'User@123'  },
};

export default function LoginPage() {
  const { user, loginSuccess } = useAuth();
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState('admin');
  const [form, setForm] = useState(CREDENTIALS.admin);
  const [errors, setErrors] = useState({});
  const [apiError, setApiError] = useState('');
  const [loading, setLoading] = useState(false);

  if (user) return <Navigate to="/dashboard" replace />;

  const switchTab = (role) => {
    setActiveTab(role);
    setForm(CREDENTIALS[role]);
    setErrors({});
    setApiError('');
  };

  const validate = () => {
    const e = {};
    if (!form.email) e.email = 'Email is required';
    else if (!/\S+@\S+\.\S+/.test(form.email)) e.email = 'Invalid email';
    if (!form.password) e.password = 'Password is required';
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
      const { data } = await login(form.email, form.password);
      loginSuccess(data);
      navigate('/dashboard');
    } catch (err) {
      const msg =
        err.response?.data?.non_field_errors?.[0] ||
        err.response?.data?.detail ||
        'Invalid email or password.';
      setApiError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page">
      <div className="login-card">

        {/* Logo */}
        <div className="login-logo">
          <h1>Task<span>AI</span></h1>
          <p>AI-Powered Knowledge Management</p>
        </div>

        {/* Role tabs */}
        <div style={{
          display: 'flex', borderRadius: 8, overflow: 'hidden',
          border: '1px solid var(--gray-200)', marginBottom: 24,
        }}>
          {['admin', 'user'].map((role) => (
            <button
              key={role}
              type="button"
              onClick={() => switchTab(role)}
              style={{
                flex: 1, padding: '9px 0', border: 'none', cursor: 'pointer',
                fontWeight: 600, fontSize: 13, transition: 'all .15s',
                background: activeTab === role
                  ? (role === 'admin' ? 'var(--primary)' : 'var(--success)')
                  : 'var(--gray-50)',
                color: activeTab === role ? '#fff' : 'var(--gray-500)',
              }}
            >
              {role === 'admin' ? '🛡 Admin' : '👤 User'}
            </button>
          ))}
        </div>

        {/* Role description */}
        <div style={{
          background: activeTab === 'admin' ? 'var(--primary-light)' : 'var(--success-light)',
          border: `1px solid ${activeTab === 'admin' ? 'rgba(99,102,241,.2)' : 'rgba(16,185,129,.2)'}`,
          borderRadius: 8, padding: '10px 14px', marginBottom: 20, fontSize: 12.5,
          color: activeTab === 'admin' ? 'var(--primary-dark)' : '#065f46',
        }}>
          {activeTab === 'admin' ? (
            <><strong>Admin access:</strong> Upload documents, create &amp; assign tasks, view analytics.</>
          ) : (
            <><strong>User access:</strong> View assigned tasks, update task status, search documents.</>
          )}
        </div>

        {apiError && <div className="alert alert-error">{apiError}</div>}

        <form onSubmit={handleSubmit} noValidate>
          <div className="form-group">
            <label className="form-label">Email address</label>
            <input
              type="email"
              className={`form-control${errors.email ? ' error' : ''}`}
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
            />
            {errors.email && <p className="form-error">{errors.email}</p>}
          </div>

          <div className="form-group">
            <label className="form-label">Password</label>
            <input
              type="password"
              className={`form-control${errors.password ? ' error' : ''}`}
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
            />
            {errors.password && <p className="form-error">{errors.password}</p>}
          </div>

          <button
            type="submit"
            className="btn btn-primary"
            style={{ width: '100%', justifyContent: 'center', padding: '10px', marginBottom: 16 }}
            disabled={loading}
          >
            {loading
              ? <><span className="spinner" /> Signing in...</>
              : `Sign in as ${activeTab === 'admin' ? 'Admin' : 'User'}`}
          </button>
        </form>

        {/* Show "Create an account" only for User tab */}
        {activeTab === 'user' && (
          <div style={{ borderTop: '1px solid var(--gray-100)', paddingTop: 16, textAlign: 'center' }}>
            <p style={{ fontSize: 13, color: 'var(--gray-500)' }}>
              New here?{' '}
              <a href="/register" style={{ color: 'var(--primary)', fontWeight: 500 }}>
                Create an account
              </a>
            </p>
          </div>
        )}

      </div>
    </div>
  );
}
