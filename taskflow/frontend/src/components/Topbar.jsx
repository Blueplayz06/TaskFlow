import React from 'react';
import { useAuth } from '../context/AuthContext';

export default function Topbar({ title = 'Dev Sprint #4', subtitle = '12 tasks · Due Jul 28' }) {
  const { user } = useAuth();
  const initials = user?.name?.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) || 'UA';

  return (
    <header className="flex items-center justify-between px-5 py-3 bg-[#0f0f15] border-b border-[#1e1e2a] sticky top-0 z-30 flex-shrink-0">
      {/* Left: Logo + breadcrumb */}
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 bg-violet-600 rounded-lg flex items-center justify-center flex-shrink-0">
            <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
              <rect x="1" y="1" width="6" height="6" rx="1.5" fill="white"/>
              <rect x="9" y="1" width="6" height="6" rx="1.5" fill="white" opacity="0.7"/>
              <rect x="1" y="9" width="6" height="6" rx="1.5" fill="white" opacity="0.7"/>
              <rect x="9" y="9" width="6" height="6" rx="1.5" fill="white" opacity="0.4"/>
            </svg>
          </div>
          <span className="text-white font-bold text-base" style={{ fontFamily: 'Syne, sans-serif' }}>TaskFlow</span>
        </div>
        <div className="flex items-center gap-2 text-[#5a5a72]">
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
            <path d="M4 2l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          <span className="text-[13px] font-medium text-[#c0c0d0]">{title}</span>
          {subtitle && <span className="text-[12px] text-[#5a5a72] hidden sm:inline">{subtitle}</span>}
        </div>
      </div>

      {/* Right */}
      <div className="flex items-center gap-2.5">
        {/* Live indicator */}
        <span className="hidden sm:flex items-center gap-1.5 text-[12px] text-[#9090a8] bg-[#1a1a24] px-2.5 py-1.5 rounded-full border border-[#2e2e3a]">
          <LiveDot />
          3 online
        </span>

        {/* Member avatars */}
        <div className="hidden sm:flex -space-x-2">
          {['AK', 'MR', 'PL'].map((i) => (
            <div key={i} className="w-7 h-7 rounded-full bg-gradient-to-br from-violet-600 to-blue-500 flex items-center justify-center text-[9px] font-bold text-white border-2 border-[#0f0f15]">
              {i}
            </div>
          ))}
        </div>

        {/* Invite */}
        <button className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[#2e2e3a] text-[12.5px] text-[#9090a8] hover:text-white hover:bg-[#1a1a24] transition-colors">
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
            <circle cx="5" cy="4" r="2.5" stroke="currentColor" strokeWidth="1.2"/>
            <path d="M1.5 10c0-2 1.57-3 3.5-3M9 7v4M7 9h4" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
          </svg>
          Invite Team
        </button>

        {/* Bell */}
        <button className="relative w-8 h-8 rounded-lg border border-[#2e2e3a] flex items-center justify-center text-[#9090a8] hover:text-white hover:bg-[#1a1a24] transition-colors">
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
            <path d="M7 1.5a4 4 0 014 4v3l1 1.5H2L3 8.5v-3a4 4 0 014-4z" stroke="currentColor" strokeWidth="1.2"/>
            <path d="M5.5 11.5a1.5 1.5 0 003 0" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
          </svg>
          <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 bg-violet-500 rounded-full" />
        </button>

        {/* Help */}
        <button className="hidden sm:flex w-8 h-8 rounded-lg border border-[#2e2e3a] items-center justify-center text-[#9090a8] hover:text-white hover:bg-[#1a1a24] transition-colors text-sm font-semibold">
          ?
        </button>

        {/* Avatar */}
        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-violet-500 to-blue-500 flex items-center justify-center text-[11px] font-bold text-white cursor-pointer">
          {initials}
        </div>
      </div>
    </header>
  );
}

function LiveDot() {
  return (
    <span className="relative inline-flex w-2 h-2">
      <span className="absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75 animate-ping" />
      <span className="relative inline-flex rounded-full w-2 h-2 bg-green-400" />
    </span>
  );
}
