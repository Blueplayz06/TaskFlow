import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { getProjects } from './api/client';
import Board    from './components/Board';
import Sidebar  from './components/Sidebar';
import Topbar   from './components/Topbar';
import Login    from './pages/Login';
import Register from './pages/Register';

// ── Route guard
function PrivateRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading) return (
    <div className="min-h-screen bg-[#0f0f13] flex items-center justify-center">
      <div className="w-8 h-8 border-2 border-violet-500 border-t-transparent rounded-full animate-spin" />
    </div>
  );
  return user ? children : <Navigate to="/login" replace />;
}

// ── Main app shell (authenticated)
function AppShell() {
  const { user } = useAuth();
  const [activeNav, setActiveNav]       = useState('board');
  const [projectId, setProjectId]       = useState(null);
  const [projectName, setProjectName]   = useState('My Project');
  const [loading, setLoading]           = useState(true);

  useEffect(() => {
    getProjects()
      .then((res) => {
        if (res.data.length > 0) {
          setProjectId(res.data[0].id);
          setProjectName(res.data[0].name);
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [user]);

  if (loading) return (
    <div className="min-h-screen bg-[#0f0f13] flex items-center justify-center">
      <div className="w-8 h-8 border-2 border-violet-500 border-t-transparent rounded-full animate-spin" />
    </div>
  );

  return (
    <div className="flex flex-col min-h-screen bg-[#0f0f13] text-white">
      <Topbar title={projectName} subtitle="Due Jul 28" />
      <div className="flex flex-1 overflow-hidden" style={{ height: 'calc(100vh - 57px)' }}>
        <Sidebar activeNav={activeNav} onNavChange={setActiveNav} />
        <main className="flex-1 flex flex-col overflow-hidden">
          {activeNav === 'board' && projectId && <Board projectId={projectId} />}
          {activeNav === 'board' && !projectId && (
            <div className="flex-1 flex items-center justify-center text-[#5a5a72] text-sm">
              No projects found. Create one to get started.
            </div>
          )}
          {activeNav !== 'board' && (
            <div className="flex-1 flex items-center justify-center text-[#5a5a72] text-sm">
              {activeNav.charAt(0).toUpperCase() + activeNav.slice(1)} — coming in a future step
            </div>
          )}
        </main>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login"    element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/*"        element={
            <PrivateRoute><AppShell /></PrivateRoute>
          } />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
