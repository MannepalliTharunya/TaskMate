import React from 'react';
import { useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const PAGE_TITLES = {
  '/dashboard': 'Dashboard',
  '/tasks': 'Tasks',
  '/tasks/create': 'Create Task',
  '/documents': 'Documents',
  '/search': 'AI Search',
  '/analytics': 'Analytics',
};

export default function Navbar() {
  const { user, isAdmin } = useAuth();
  const location = useLocation();

  const title = PAGE_TITLES[location.pathname] || 'TaskAI';

  return (
    <header className="navbar">
      <span className="navbar-title">{title}</span>
      <div className="navbar-right">
        <span className={`badge-role ${isAdmin ? 'admin' : 'user'}`}>
          {user?.role?.name || 'user'}
        </span>
        <span style={{ fontSize: 13, color: 'var(--gray-500)' }}>
          {user?.email}
        </span>
      </div>
    </header>
  );
}
