import React, { useState } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { ThemeProvider } from './contexts/ThemeContext';
import { SearchProvider } from './contexts/SearchContext';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

import { Sidebar } from './components/layout/Sidebar';
import { Header } from './components/layout/Header';
import { CommandPalette } from './components/layout/CommandPalette';
import { AIAssistantModal } from './components/ai/AIAssistantModal';

import { LoginPage } from './pages/LoginPage';
import { DashboardPage } from './pages/DashboardPage';
import { StudentsPage } from './pages/StudentsPage';
import { DetectPage } from './pages/DetectPage';
import { ViolationsPage } from './pages/ViolationsPage';
import { ReportsPage } from './pages/ReportsPage';
import { SettingsPage } from './pages/SettingsPage';
import { UserManagementPage } from './pages/UserManagementPage';
import { StudentPortalPage } from './pages/StudentPortalPage';
import { ProtectedPermissionRoute } from './components/auth/ProtectedPermissionRoute';

import { MsalProvider } from '@azure/msal-react';
import { msalInstance } from './services/msalConfig';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

const DefaultRedirect: React.FC = () => {
  const { user, hasPermission } = useAuth();
  if (hasPermission('student.self') && (user?.role || '').toUpperCase() === 'STUDENT') {
    return <Navigate to="/student-portal" replace />;
  }
  if (hasPermission('dashboard.view')) return <Navigate to="/dashboard" replace />;
  if (hasPermission('students.view')) return <Navigate to="/students" replace />;
  if (hasPermission('recognition.view')) return <Navigate to="/detect" replace />;
  if (hasPermission('violations.view')) return <Navigate to="/violations" replace />;
  return <Navigate to="/student-portal" replace />;
};

const ProtectedLayout: React.FC = () => {
  const { isAuthenticated } = useAuth();
  const [isAIOpen, setIsAIOpen] = useState(false);

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return (
    <div className="flex min-h-screen text-slate-700 dark:text-slate-200 font-sans p-4 md:p-6 gap-6 relative scroll-smooth">
      {/* Floating Apple Mesh Background */}
      <div className="apple-mesh-bg">
        <div className="apple-mesh-blob-3" />
      </div>

      <Sidebar onOpenAI={() => setIsAIOpen(true)} />

      <div className="flex-1 flex flex-col min-w-0 gap-5">
        <Header onOpenAI={() => setIsAIOpen(true)} />
        <main className="flex-1 max-w-7xl w-full mx-auto pb-10">
          <Routes>
            <Route
              path="/dashboard"
              element={
                <ProtectedPermissionRoute permission="dashboard.view">
                  <DashboardPage />
                </ProtectedPermissionRoute>
              }
            />
            <Route
              path="/students"
              element={
                <ProtectedPermissionRoute permission="students.view">
                  <StudentsPage />
                </ProtectedPermissionRoute>
              }
            />
            <Route
              path="/detect"
              element={
                <ProtectedPermissionRoute permission="recognition.view">
                  <DetectPage />
                </ProtectedPermissionRoute>
              }
            />
            <Route
              path="/violations"
              element={
                <ProtectedPermissionRoute permission="violations.view">
                  <ViolationsPage />
                </ProtectedPermissionRoute>
              }
            />
            <Route
              path="/reports"
              element={
                <ProtectedPermissionRoute permission="reports.view">
                  <ReportsPage />
                </ProtectedPermissionRoute>
              }
            />
            <Route
              path="/users"
              element={
                <ProtectedPermissionRoute permission="users.manage">
                  <UserManagementPage />
                </ProtectedPermissionRoute>
              }
            />
            <Route
              path="/settings"
              element={
                <ProtectedPermissionRoute permission="settings.manage">
                  <SettingsPage />
                </ProtectedPermissionRoute>
              }
            />
            <Route
              path="/student-portal"
              element={
                <ProtectedPermissionRoute permission="student.self">
                  <StudentPortalPage />
                </ProtectedPermissionRoute>
              }
            />
            <Route path="*" element={<DefaultRedirect />} />
          </Routes>
        </main>
      </div>

      <CommandPalette />
      <AIAssistantModal isOpen={isAIOpen} onClose={() => setIsAIOpen(false)} />
    </div>
  );
};

export function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <MsalProvider instance={msalInstance}>
          <AuthProvider>
            <SearchProvider>

            {/* Ambient background for login route as well */}
            <div className="apple-mesh-bg">
              <div className="apple-mesh-blob-3" />
            </div>

            <Routes>
              <Route path="/login" element={<LoginPage />} />
              <Route path="/*" element={<ProtectedLayout />} />
            </Routes>
          </SearchProvider>
        </AuthProvider>
      </MsalProvider>
    </ThemeProvider>
  </QueryClientProvider>
  );
}

export default App;
