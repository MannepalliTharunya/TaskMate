import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { register } from '../services/authService';
import { useAuth } from '../context/AuthContext';

export default function RegisterPage() {
  const { loginSuccess } = useAuth();
  const navigate = useNavigate();

  const [form, setForm] = useState({
    email: '', username: '', first_name: '', last_name: '',
    password: '', confirm_password: '', role: 'user',
  });
  const [errors, setErrors] = useState({});
  const [apiError, setApiError] = useState('');
  const [loading, setLoading] = useState(false);

  const validate = () => {
    const e = {};
    if (!form.email) e.email = 'Email is required';
    else if (!/\S+@\S+\.\S+/.test(form.email)) e.email = 'Invalid email';
    if (!form.username) e.username = 'Username is required';
    if (!form.password) e.password = 'Password is required';
    else if (form.password.length < 8) e.password = 'Minimum 8 characters';
    if (form.password !== form.confirm_password) e.confirm_password = 'Passwords do not match';
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
      const { data } = await register({
        email: form.email,
        username: form.username,
        first_name: form.first_name,
        last_name: form.last_name,
        password: form.password,
        role: form.role,
      });
      loginSuccess(data);
      navigate('/dashboard');
    } catch (err) {
      const data = err.response?.data;
      if (data && typeof data === 'object') {
        const msgs = Object.entries(data)
          .map(([k, v]) => `${k}: ${Array.isArray(v) ? v[0] : v}`)
          .join(' | ');
        setApiError(msgs);
      } else {
        setApiError('Registration failed. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const set = (field) => (e) => setForm({ ...form, [field]: e.target.value });

  return (
    <div className="login-page">
      <div className="login-card" style={{ maxWidth: 460 }}>
        <div className="login-logo">
          <h1>Task<span>AI</span></h1>
          <p>Create your account</p>
        </div>

        {/* Role selector */}
        <div style={{
          display: 'flex', borderRadius: 8, overflow: 'hidden',
          border: '1px solid var(--gray-200)', marginBottom: 20,
        }}>
          {['user', 'admin'].map((role) => (
            <button
              key={role}
              type="button"
              onClick={() => setForm({ ...form, role })}
              style={{
                flex: 1, padding: '9px 0', border: 'none', cursor: 'pointer',
                fontWeight: 600, fontSize: 13, transition: 'all .15s',
                background: form.role === role
                  ? (role === 'admin' ? 'var(--primary)' : 'var(--success)')
                  : 'var(--gray-50)',
                color: form.role === role ? '#fff' : 'var(--gray-500)',
              }}
            >
              {role === 'admin' ? '🛡 Admin' : '👤 User'}
            </button>
          ))}
        </div>

        {apiError && <div className="alert alert-error">{apiError}</div>}

        <form onSubmit={handleSubmit} noValidate>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 12px' }}>
            <div className="form-group">
              <label className="form-label">First name</label>
              <input className="form-control" placeholder="Alice" value={form.first_name} onChange={set('first_name')} />
            </div>
            <div className="form-group">
              <label className="form-label">Last name</label>
              <input className="form-control" placeholder="Smith" value={form.last_name} onChange={set('last_name')} />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Email address *</label>
            <input
              type="email"
              className={`form-control${errors.email ? ' error' : ''}`}
              placeholder="you@example.com"
              value={form.email}
              onChange={set('email')}
            />
            {errors.email && <p className="form-error">{errors.email}</p>}
          </div>

          <div className="form-group">
            <label className="form-label">Username *</label>
            <input
              className={`form-control${errors.username ? ' error' : ''}`}
              placeholder="johndoe"
              value={form.username}
              onChange={set('username')}
            />
            {errors.username && <p className="form-error">{errors.username}</p>}
          </div>

          <div className="form-group">
            <label className="form-label">Password *</label>
            <input
              type="password"
              className={`form-control${errors.password ? ' error' : ''}`}
              placeholder="Min. 8 characters"
              value={form.password}
              onChange={set('password')}
            />
            {errors.password && <p className="form-error">{errors.password}</p>}
          </div>

          <div className="form-group">
            <label className="form-label">Confirm password *</label>
            <input
              type="password"
              className={`form-control${errors.confirm_password ? ' error' : ''}`}
              placeholder="Repeat password"
              value={form.confirm_password}
              onChange={set('confirm_password')}
            />
            {errors.confirm_password && <p className="form-error">{errors.confirm_password}</p>}
          </div>

          <button
            type="submit"
            className="btn btn-primary"
            style={{ width: '100%', justifyContent: 'center', padding: '10px', marginBottom: 14 }}
            disabled={loading}
          >
            {loading ? <><span className="spinner" /> Creating account...</> : `Register as ${form.role}`}
          </button>
        </form>

        <p style={{ textAlign: 'center', fontSize: 13, color: 'var(--gray-500)' }}>
          Already have an account?{' '}
          <Link to="/login" style={{ color: 'var(--primary)', fontWeight: 500 }}>Sign in</Link>
        </p>
      </div>
    </div>
  );
}
