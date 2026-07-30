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

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

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
            <Route path="/dashboard" element={<DashboardPage />} />
            <Route path="/students" element={<StudentsPage />} />
            <Route path="/detect" element={<DetectPage />} />
            <Route path="/violations" element={<ViolationsPage />} />
            <Route path="/reports" element={<ReportsPage />} />
            <Route path="/users" element={<UserManagementPage />} />
            <Route path="/settings" element={<SettingsPage />} />
            <Route path="*" element={<Navigate to="/dashboard" replace />} />
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
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;
