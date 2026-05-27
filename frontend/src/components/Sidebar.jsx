import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Icon = ({ d, size = 16 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d={d} />
  </svg>
);

const icons = {
  dashboard: 'M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z M9 22V12h6v10',
  tasks: 'M9 11l3 3L22 4 M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11',
  createTask: 'M12 5v14 M5 12h14',
  documents: 'M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z M14 2v6h6',
  search: 'M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0',
  analytics: 'M18 20V10 M12 20V4 M6 20v-6',
};

export default function Sidebar() {
  const { user, logout, isAdmin } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const initials = user
    ? `${user.first_name?.[0] || ''}${user.last_name?.[0] || ''}`.toUpperCase() ||
      user.email[0].toUpperCase()
    : '?';

  return (
    <aside className="sidebar">
      <div className="sidebar-logo">
        <h1>Task<span>AI</span></h1>
        <p>Knowledge Management</p>
      </div>

      <nav className="sidebar-nav">
        <div className="nav-section-label">Main</div>

        <NavLink to="/dashboard" className={({ isActive }) => `nav-item${isActive ? ' active' : ''}`}>
          <Icon d={icons.dashboard} /> Dashboard
        </NavLink>

        <NavLink to="/tasks" className={({ isActive }) => `nav-item${isActive ? ' active' : ''}`}>
          <Icon d={icons.tasks} /> Tasks
        </NavLink>

        {isAdmin && (
          <NavLink to="/tasks/create" className={({ isActive }) => `nav-item${isActive ? ' active' : ''}`}>
            <Icon d={icons.createTask} /> Create Task
          </NavLink>
        )}

        <div className="nav-section-label">Knowledge</div>

        <NavLink to="/documents" className={({ isActive }) => `nav-item${isActive ? ' active' : ''}`}>
          <Icon d={icons.documents} /> Documents
        </NavLink>

        <NavLink to="/search" className={({ isActive }) => `nav-item${isActive ? ' active' : ''}`}>
          <Icon d={icons.search} /> AI Search
        </NavLink>

        {isAdmin && (
          <>
            <div className="nav-section-label">Admin</div>
            <NavLink to="/analytics" className={({ isActive }) => `nav-item${isActive ? ' active' : ''}`}>
              <Icon d={icons.analytics} /> Analytics
            </NavLink>
          </>
        )}
      </nav>

      <div className="sidebar-footer">
        <div className="user-info">
          <div className="user-avatar">{initials}</div>
          <div className="user-details">
            <div className="user-name">{user?.username || user?.email}</div>
            <div className="user-role">{user?.role?.name || 'user'}</div>
          </div>
        </div>
        <button className="btn-logout" onClick={handleLogout}>Sign out</button>
      </div>
    </aside>
  );
}
