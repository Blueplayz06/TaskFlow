import React from 'react';
import { useState } from 'react';
import { useAuth } from '../context/AuthContext';

const NAV = [
  { id: 'board',    label: 'Board',    icon: GridIcon,  badge: null  },
  { id: 'mytasks',  label: 'My Tasks', icon: ListIcon,  badge: '5'   },
  { id: 'timeline', label: 'Timeline', icon: ClockIcon, badge: null  },
  { id: 'reports',  label: 'Reports',  icon: ChartIcon, badge: null  },
];

const PROJECTS = [
  { id: 'p1', name: 'Dev Sprint #4',  color: '#7c6ff7', active: true  },
  { id: 'p2', name: 'Marketing Q3',   color: '#22c988', active: false },
  { id: 'p3', name: 'Infra Upgrade',  color: '#f5a623', active: false },
];

export default function Sidebar({ activeNav = 'board', onNavChange }) {
  const { user, logout } = useAuth();
  const [activeProject, setActiveProject] = useState('p1');

  return (
    <aside className="w-[220px] flex-shrink-0 bg-[#17171e] border-r border-[#2e2e3a] flex flex-col py-4 px-3 h-full overflow-y-auto">
      {/* Section: Workspace */}
      <SectionLabel>Workspace</SectionLabel>
      {NAV.map((item) => (
        <NavItem
          key={item.id}
          Icon={item.icon}
          label={item.label}
          badge={item.badge}
          active={activeNav === item.id}
          onClick={() => onNavChange?.(item.id)}
        />
      ))}

      {/* Section: Projects */}
      <SectionLabel className="mt-3">Projects</SectionLabel>
      {PROJECTS.map((p) => (
        <button
          key={p.id}
          onClick={() => setActiveProject(p.id)}
          className={`flex items-center gap-2.5 w-full px-2.5 py-2 rounded-lg text-[13.5px] transition-colors text-left
            ${activeProject === p.id
              ? 'bg-[#1e1e28] text-white font-medium'
              : 'text-[#9090a8] hover:bg-[#1e1e28] hover:text-white'}
          `}
        >
          <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: p.color }} />
          {p.name}
        </button>
      ))}

      {/* Add project */}
      <button className="flex items-center gap-2 px-2.5 py-2 mt-1 rounded-lg text-[13px] text-[#5a5a72] hover:text-[#9090a8] transition-colors">
        <span className="w-4 h-4 rounded border border-dashed border-[#3a3a48] flex items-center justify-center text-xs">+</span>
        New project
      </button>

      {/* Bottom: user */}
      <div className="mt-auto pt-4 border-t border-[#2e2e3a]">
        <div className="flex items-center gap-2.5 px-2.5 py-2 rounded-lg hover:bg-[#1e1e28] transition-colors cursor-pointer group">
          <div className="w-7 h-7 rounded-full bg-gradient-to-br from-violet-500 to-blue-500 flex items-center justify-center text-[11px] font-semibold text-white flex-shrink-0">
            {user?.name?.slice(0, 2).toUpperCase() || 'JS'}
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-[12.5px] font-medium text-white truncate">{user?.name || 'You'}</div>
            <div className="text-[10.5px] text-[#5a5a72] truncate">{user?.email || 'dev@taskflow.io'}</div>
          </div>
          <button
            onClick={logout}
            className="opacity-0 group-hover:opacity-100 transition-opacity text-[#5a5a72] hover:text-red-400"
            title="Sign out"
          >
            <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
              <path d="M5 2H2v9h3M9 9l3-3-3-3M12 6.5H5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
        </div>
      </div>
    </aside>
  );
}

function SectionLabel({ children, className = '' }) {
  return (
    <p className={`text-[10px] font-semibold uppercase tracking-widest text-[#5a5a72] px-2.5 py-1.5 ${className}`}>
      {children}
    </p>
  );
}

function NavItem({ Icon, label, badge, active, onClick }) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-2.5 w-full px-2.5 py-2 rounded-lg text-[13.5px] transition-colors
        ${active
          ? 'bg-violet-500/15 text-violet-300 font-medium'
          : 'text-[#9090a8] hover:bg-[#1e1e28] hover:text-white'}
      `}
    >
      <Icon size={15} />
      <span className="flex-1 text-left">{label}</span>
      {badge && (
        <span className={`text-[10.5px] rounded-full px-1.5 py-0.5 font-semibold
          ${active ? 'bg-violet-500 text-white' : 'bg-[#25252f] text-[#9090a8]'}`}>
          {badge}
        </span>
      )}
    </button>
  );
}

// ── Inline SVG icons
function GridIcon({ size = 16 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" fill="none">
      <rect x="1" y="1" width="6" height="6" rx="1.5" fill="currentColor"/>
      <rect x="9" y="1" width="6" height="6" rx="1.5" fill="currentColor"/>
      <rect x="1" y="9" width="6" height="6" rx="1.5" fill="currentColor"/>
      <rect x="9" y="9" width="6" height="6" rx="1.5" fill="currentColor"/>
    </svg>
  );
}
function ListIcon({ size = 16 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" fill="none">
      <path d="M2 4h12M2 8h8M2 12h10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
    </svg>
  );
}
function ClockIcon({ size = 16 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" fill="none">
      <circle cx="8" cy="8" r="6" stroke="currentColor" strokeWidth="1.5"/>
      <path d="M8 5v3.5l2 1.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
    </svg>
  );
}
function ChartIcon({ size = 16 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" fill="none">
      <path d="M2 12l4-4 3 3 5-6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );
}

