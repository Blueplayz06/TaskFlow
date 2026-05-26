import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';

export default function Sidebar({ activeNav = 'board', onNavChange, projects = [], activeProject, onProjectChange }) {
  const { user, logout } = useAuth();
  const initials = user?.name?.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) || 'UA';

  return (
    <aside className="w-[210px] flex-shrink-0 bg-[#0d0d14] border-r border-[#1e1e2a] flex flex-col h-full overflow-y-auto">
      {/* New Project button */}
      <div className="p-3 border-b border-[#1e1e2a]">
        <button className="w-full flex items-center gap-2 px-3 py-2 rounded-lg bg-violet-600/15 border border-violet-500/20 text-violet-300 text-[13px] font-medium hover:bg-violet-600/25 transition-colors">
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
            <path d="M7 2v10M2 7h10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
          </svg>
          New Project
        </button>
      </div>

      {/* Nav */}
      <div className="px-2 py-3">
        <SectionLabel>Workspace</SectionLabel>
        <NavItem id="board" label="Dashboard" icon={<GridIcon />} active={activeNav === 'board'} onClick={() => onNavChange?.('board')} />
        <NavItem id="mytasks" label="Tasks" icon={<ListIcon />} active={activeNav === 'mytasks'} onClick={() => onNavChange?.('mytasks')} badge="5" />
        <NavItem id="timeline" label="Timeline" icon={<TimeIcon />} active={activeNav === 'timeline'} onClick={() => onNavChange?.('timeline')} />
        <NavItem id="reports" label="Reports" icon={<ChartIcon />} active={activeNav === 'reports'} onClick={() => onNavChange?.('reports')} />
        <NavLink to="/timeline">
          <NavLink to="/reports">Reports</NavLink>
          <ChartGanttIcon />
          Timeline
        </NavLink>
      </div>

      {/* Projects */}
      <div className="px-2 pb-3 flex-1">
        <SectionLabel>Projects</SectionLabel>
        {projects.length > 0 ? projects.map((p, i) => {
          const colors = ['#7c6ff7', '#22c988', '#f5a623', '#4fa3f7', '#f25c6e'];
          const color = colors[i % colors.length];
          return (
            <button
              key={p.id}
              onClick={() => onProjectChange?.(p.id, p.name)}
              className={`flex items-center gap-2.5 w-full px-2.5 py-2 rounded-lg text-[13px] transition-colors text-left mb-0.5
                ${activeProject === p.id ? 'bg-[#1a1a24] text-white font-medium' : 'text-[#9090a8] hover:bg-[#1a1a24] hover:text-white'}`}
            >
              <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: color }} />
              <span className="truncate">{p.name}</span>
            </button>
          );
        }) : (
          ['Dev Sprint #4', 'Marketing Q3', 'Infra Upgrade'].map((name, i) => {
            const colors = ['#7c6ff7', '#22c988', '#f5a623'];
            return (
              <div key={name} className="flex items-center gap-2.5 px-2.5 py-2 text-[13px] text-[#9090a8]">
                <span className="w-2 h-2 rounded-full" style={{ background: colors[i] }} />
                <span className="truncate">{name}</span>
              </div>
            );
          })
        )}
      </div>

      {/* Profile */}
      <div className="p-3 border-t border-[#1e1e2a]">
        <div className="flex items-center gap-2.5 px-2 py-2 rounded-lg hover:bg-[#1a1a24] transition-colors cursor-pointer group">
          <div className="w-7 h-7 rounded-full bg-gradient-to-br from-violet-500 to-blue-500 flex items-center justify-center text-[10px] font-bold text-white flex-shrink-0">
            {initials}
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-[12.5px] font-medium text-white truncate">{user?.name || 'User'}</div>
            <div className="text-[10.5px] text-[#5a5a72] truncate">{user?.email || ''}</div>
          </div>
          <button onClick={logout} className="opacity-0 group-hover:opacity-100 transition-opacity text-[#5a5a72] hover:text-red-400 p-1" title="Sign out">
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
              <path d="M4.5 2H2v8h2.5M8 8.5l3-3-3-3M11 5.5H5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
        </div>
      </div>
    </aside>
  );
}

function SectionLabel({ children }) {
  return <p className="text-[10px] font-semibold uppercase tracking-widest text-[#3a3a52] px-2.5 py-1.5 mb-0.5">{children}</p>;
}

function NavItem({ id, label, icon, active, onClick, badge }) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-2.5 w-full px-2.5 py-2 rounded-lg text-[13px] transition-colors mb-0.5
        ${active ? 'bg-[#1a1a24] text-white font-medium' : 'text-[#9090a8] hover:bg-[#1a1a24] hover:text-white'}`}
    >
      <span className={active ? 'text-violet-400' : 'text-[#5a5a72]'}>{icon}</span>
      <span className="flex-1 text-left">{label}</span>
      {badge && (
        <span className={`text-[10px] rounded-full px-1.5 py-0.5 font-semibold ${active ? 'bg-violet-500 text-white' : 'bg-[#1e1e2a] text-[#9090a8]'}`}>
          {badge}
        </span>
      )}
    </button>
  );
}

const GridIcon = () => (<svg width="14" height="14" viewBox="0 0 14 14" fill="none"><rect x="1" y="1" width="5" height="5" rx="1" fill="currentColor" /><rect x="8" y="1" width="5" height="5" rx="1" fill="currentColor" /><rect x="1" y="8" width="5" height="5" rx="1" fill="currentColor" /><rect x="8" y="8" width="5" height="5" rx="1" fill="currentColor" /></svg>);
const ListIcon = () => (<svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M2 4h10M2 7.5h7M2 11h9" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" /></svg>);
const TimeIcon = () => (<svg width="14" height="14" viewBox="0 0 14 14" fill="none"><circle cx="7" cy="7" r="5.5" stroke="currentColor" strokeWidth="1.3" /><path d="M7 4.5V7.5l2 1.5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" /></svg>);
const ChartIcon = () => (<svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M2 11l3-4 3 2 4-6" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" /></svg>);
