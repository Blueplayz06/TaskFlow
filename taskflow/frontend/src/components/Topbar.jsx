import React from 'react';
import { useAuth } from '../context/AuthContext';

export default function Topbar({ title = 'Dev Sprint #4', subtitle = '12 tasks · Due Jul 28' }) {
  const { user } = useAuth();

  return (
    <header className="flex items-center justify-between px-6 py-3.5 bg-[#17171e] border-b border-[#2e2e3a] sticky top-0 z-30 flex-shrink-0">
      {/* Left: brand + breadcrumb */}
      <div className="flex items-center gap-4">
        <span className="font-[Syne,sans-serif] text-[18px] font-bold tracking-tight bg-gradient-to-r from-violet-300 via-violet-400 to-blue-400 bg-clip-text text-transparent">
          TaskFlow
        </span>
        <span className="text-[#5a5a72] text-sm select-none">/</span>
        <div>
          <span className="text-[14px] font-semibold text-white">{title}</span>
          <span className="text-[12px] text-[#5a5a72] ml-2">{subtitle}</span>
        </div>
      </div>

      {/* Right */}
      <div className="flex items-center gap-3">
        {/* Live indicator */}
        <span className="flex items-center gap-1.5 text-[12px] text-[#9090a8]">
          <LiveDot />
          3 online
        </span>

        {/* Member avatars */}
        <div className="flex -space-x-2">
          {['AK', 'MR', 'PL'].map((initials) => (
            <div
              key={initials}
              className="w-7 h-7 rounded-full bg-gradient-to-br from-violet-600 to-blue-500 flex items-center justify-center text-[10px] font-semibold text-white border-2 border-[#17171e]"
            >
              {initials}
            </div>
          ))}
        </div>

        {/* Divider */}
        <div className="w-px h-5 bg-[#2e2e3a]" />

        {/* Invite button */}
        <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[#2e2e3a] text-[12.5px] text-[#9090a8] hover:text-white hover:bg-[#1e1e28] transition-colors">
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
            <circle cx="5" cy="4" r="2.5" stroke="currentColor" strokeWidth="1.2"/>
            <path d="M1.5 10c0-2 1.57-3 3.5-3M9 7v4M7 9h4" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
          </svg>
          Invite
        </button>

        {/* Notification bell */}
        <button className="relative w-8 h-8 rounded-lg border border-[#2e2e3a] flex items-center justify-center text-[#9090a8] hover:text-white hover:bg-[#1e1e28] transition-colors">
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
            <path d="M7 1.5a4 4 0 014 4v3l1 1.5H2L3 8.5v-3a4 4 0 014-4z" stroke="currentColor" strokeWidth="1.2"/>
            <path d="M5.5 11.5a1.5 1.5 0 003 0" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
          </svg>
          <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 bg-violet-500 rounded-full" />
        </button>

        {/* Avatar */}
        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-violet-500 to-blue-500 flex items-center justify-center text-[11px] font-semibold text-white cursor-pointer">
          {user?.name?.slice(0, 2).toUpperCase() || 'JS'}
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

