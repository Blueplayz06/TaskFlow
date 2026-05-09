import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
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
  const [activeNav, setActiveNav] = useState('board');
  const PROJECT_ID = 2; // hardcoded for MVP; swap with project selector later

  return (
    <div className="flex flex-col min-h-screen bg-[#0f0f13] text-white">
      <Topbar title="Dev Sprint #4" subtitle="12 tasks · Due Jul 28" />
      <div className="flex flex-1 overflow-hidden" style={{ height: 'calc(100vh - 57px)' }}>
        <Sidebar activeNav={activeNav} onNavChange={setActiveNav} />
        <main className="flex-1 flex flex-col overflow-hidden">
          {activeNav === 'board' && <Board projectId={PROJECT_ID} />}
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




