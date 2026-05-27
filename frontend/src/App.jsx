import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './routes/ProtectedRoute';
import AppLayout from './components/AppLayout';

import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import DashboardPage from './pages/DashboardPage';
import TasksPage from './pages/TasksPage';
import CreateTaskPage from './pages/CreateTaskPage';
import DocumentsPage from './pages/DocumentsPage';
import SearchPage from './pages/SearchPage';
import AnalyticsPage from './pages/AnalyticsPage';

import './styles/globals.css';

function LayoutRoute({ children, adminOnly = false }) {
  return (
    <ProtectedRoute adminOnly={adminOnly}>
      <AppLayout>{children}</AppLayout>
    </ProtectedRoute>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />

          <Route path="/dashboard" element={<LayoutRoute><DashboardPage /></LayoutRoute>} />
          <Route path="/tasks" element={<LayoutRoute><TasksPage /></LayoutRoute>} />
          <Route path="/tasks/create" element={<LayoutRoute adminOnly><CreateTaskPage /></LayoutRoute>} />
          <Route path="/documents" element={<LayoutRoute><DocumentsPage /></LayoutRoute>} />
          <Route path="/search" element={<LayoutRoute><SearchPage /></LayoutRoute>} />
          <Route path="/analytics" element={<LayoutRoute adminOnly><AnalyticsPage /></LayoutRoute>} />

          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}
