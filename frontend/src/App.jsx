import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ToastProvider } from './context/ToastContext';
import Login from './pages/Login';
import DashboardLayout from './components/DashboardLayout';
import { ProtectedRoute } from './components/ProtectedRoute';

import Dashboard from './pages/Dashboard';
import MyRequests from './pages/MyRequests';
import Approvals from './pages/Approvals';
import NewRequest from './pages/NewRequest';
import RequestDetails from './pages/RequestDetails';

import AdminTemplates from './pages/AdminTemplates';
import AdminUsers from './pages/AdminUsers';
import AdminRequests from './pages/AdminRequests';

import Profile from './pages/Profile';
import Analytics from './pages/Analytics';
import Delegations from './pages/Delegations';
import AdvancedAnalytics from './pages/AdvancedAnalytics';

const App = () => {
  return (
    <ToastProvider>
      <BrowserRouter>
        <AuthProvider>
          <Routes>
            <Route path="/login" element={<Login />} />

            <Route path="/" element={
              <ProtectedRoute>
                <DashboardLayout />
              </ProtectedRoute>
            }>
              <Route index element={<Navigate to="/dashboard" replace />} />
              <Route path="dashboard" element={<Dashboard />} />
              <Route path="my-requests" element={<MyRequests />} />
              <Route path="requests/:id" element={<RequestDetails />} />
              <Route path="approvals" element={<Approvals />} />
              <Route path="requests/new" element={<NewRequest />} />
              <Route path="analytics" element={<Analytics />} />
              <Route path="advanced-analytics" element={<AdvancedAnalytics />} />
              <Route path="delegations" element={<Delegations />} />
              <Route path="templates" element={<AdminTemplates />} />
              <Route path="users" element={<AdminUsers />} />
              <Route path="global-requests" element={<AdminRequests />} />
              <Route path="profile" element={<Profile />} />
              <Route path="*" element={<Navigate to="/login" replace />} />
            </Route>
            <Route path="*" element={<Navigate to="/login" replace />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </ToastProvider>
  );
};

export default App;

