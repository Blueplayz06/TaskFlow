import React, { useState, useEffect } from 'react';
import { getTasks } from '../api/client';
import { useAuth } from '../context/AuthContext';

const PRIORITY_STYLES = {
  high:   { bg: 'bg-red-500/15',   text: 'text-red-400',   dot: 'bg-red-400'   },
  medium: { bg: 'bg-amber-500/15', text: 'text-amber-400', dot: 'bg-amber-400' },
  low:    { bg: 'bg-green-500/15', text: 'text-green-400', dot: 'bg-green-400' },
};

const STATUS_LABELS = {
  backlog: 'Backlog', todo: 'To Do', inprogress: 'In Progress',
  review: 'In Review', done: 'Done',
};

const STATUS_COLORS = {
  backlog: '#5a5a72', todo: '#4fa3f7', inprogress: '#7c6ff7',
  review: '#f5a623', done: '#22c988',
};

const TAG_COLORS = {
  Frontend: 'bg-blue-500/15 text-blue-400',
  Backend:  'bg-violet-500/15 text-violet-400',
  DevOps:   'bg-teal-500/15 text-teal-400',
  Design:   'bg-pink-500/15 text-pink-400',
  Bug:      'bg-orange-500/15 text-orange-400',
  Other:    'bg-gray-500/15 text-gray-400',
};

export default function MyTasks({ projectId }) {
  const { user } = useAuth();
  const [tasks, setTasks]       = useState([]);
  const [loading, setLoading]   = useState(true);
  const [filter, setFilter]     = useState('all');
  const [search, setSearch]     = useState('');

  useEffect(() => {
    if (!projectId) return;
    setLoading(true);
    getTasks(projectId)
      .then((res) => {
        // Filter to only tasks assigned to current user
        const mine = res.data.filter((t) =>
          t.assignee_name?.toLowerCase() === user?.name?.toLowerCase() ||
          t.assignee_id === user?.id
        );
        setTasks(mine);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [projectId, user]);

  const filtered = tasks.filter((t) => {
    const matchStatus = filter === 'all' || t.status === filter;
    const matchSearch = !search || t.title.toLowerCase().includes(search.toLowerCase());
    return matchStatus && matchSearch;
  });

  const stats = {
    total:      tasks.length,
    inprogress: tasks.filter(t => t.status === 'inprogress').length,
    done:       tasks.filter(t => t.status === 'done').length,
    high:       tasks.filter(t => t.priority === 'high').length,
  };

  if (loading) return (
    <div className="flex-1 flex items-center justify-center">
      <div className="w-8 h-8 border-2 border-violet-500 border-t-transparent rounded-full animate-spin" />
    </div>
  );

  return (
    <div className="flex-1 overflow-auto p-6">
      {/* Header */}
      <div className="mb-6">
        <h2 className="text-xl font-bold text-white" style={{ fontFamily: 'Syne, sans-serif' }}>My Tasks</h2>
        <p className="text-sm text-[#9090a8] mt-1">Tasks assigned to you across this project</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-3 mb-6">
        {[
          { num: stats.total,      label: 'Total',       color: '#9090a8' },
          { num: stats.inprogress, label: 'In Progress', color: '#7c6ff7' },
          { num: stats.done,       label: 'Completed',   color: '#22c988' },
          { num: stats.high,       label: 'High Priority',color: '#f25c6e' },
        ].map(({ num, label, color }) => (
          <div key={label} className="bg-[#0f0f15] border border-[#1e1e2a] rounded-xl px-4 py-3">
            <div className="text-2xl font-bold" style={{ color, fontFamily: 'Syne, sans-serif' }}>{num}</div>
            <div className="text-xs text-[#9090a8] mt-1">{label}</div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex items-center gap-2 mb-5 flex-wrap">
        {['all', 'todo', 'inprogress', 'review', 'done'].map((s) => (
          <button
            key={s}
            onClick={() => setFilter(s)}
            className={`px-3 py-1.5 rounded-full text-xs border transition-colors
              ${filter === s
                ? 'bg-violet-500/15 border-violet-500 text-violet-300'
                : 'border-[#2a2a38] text-[#9090a8] hover:border-[#3a3a48] hover:text-white bg-transparent'}`}
          >
            {s === 'all' ? 'All' : STATUS_LABELS[s]}
          </button>
        ))}
        <div className="ml-auto flex items-center gap-2 bg-[#0f0f15] border border-[#1e1e2a] rounded-lg px-3 py-1.5 min-w-[180px]">
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
            <circle cx="5" cy="5" r="4" stroke="#5a5a72" strokeWidth="1.3"/>
            <path d="M8.5 8.5l2 2" stroke="#5a5a72" strokeWidth="1.3" strokeLinecap="round"/>
          </svg>
          <input
            type="text"
            className="bg-transparent border-none outline-none text-[13px] text-white placeholder:text-[#5a5a72] w-full"
            placeholder="Search tasks…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      {/* Tasks list */}
      {filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="w-16 h-16 rounded-2xl bg-[#1a1a24] border border-[#2a2a38] flex items-center justify-center mb-4">
            <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
              <rect x="4" y="6" width="20" height="17" rx="2" stroke="#5a5a72" strokeWidth="1.5"/>
              <path d="M9 12h10M9 16h6" stroke="#5a5a72" strokeWidth="1.5" strokeLinecap="round"/>
              <path d="M9 4v4M14 4v4M19 4v4" stroke="#5a5a72" strokeWidth="1.5" strokeLinecap="round"/>
            </svg>
          </div>
          <p className="text-[#5a5a72] text-sm">
            {tasks.length === 0 ? 'No tasks assigned to you yet' : 'No tasks match your filter'}
          </p>
          {tasks.length === 0 && (
            <p className="text-[#3a3a52] text-xs mt-1">Ask your team to assign tasks to you</p>
          )}
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map((task) => {
            const priority = PRIORITY_STYLES[task.priority] || PRIORITY_STYLES.medium;
            const tagClass = TAG_COLORS[task.tag] || TAG_COLORS.Other;
            const dueDate  = task.due_date
              ? new Date(task.due_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
              : null;
            const isOverdue = task.due_date && new Date(task.due_date) < new Date() && task.status !== 'done';

            return (
              <div
                key={task.id}
                className="bg-[#0f0f15] border border-[#1e1e2a] rounded-xl p-4 hover:border-[#2a2a38] transition-all group"
              >
                <div className="flex items-start gap-3">
                  {/* Status dot */}
                  <div className="mt-1 flex-shrink-0">
                    <div className="w-3 h-3 rounded-full border-2" style={{ borderColor: STATUS_COLORS[task.status], background: task.status === 'done' ? STATUS_COLORS[task.status] : 'transparent' }} />
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <span className={`text-[10.5px] font-medium px-2 py-0.5 rounded-full ${tagClass}`}>
                        {task.tag}
                      </span>
                      <span className={`text-[10.5px] font-medium px-2 py-0.5 rounded-full flex items-center gap-1 ${priority.bg} ${priority.text}`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${priority.dot}`} />
                        {task.priority.charAt(0).toUpperCase() + task.priority.slice(1)}
                      </span>
                      <span className="text-[10.5px] px-2 py-0.5 rounded-full bg-[#1a1a24] text-[#9090a8]">
                        {STATUS_LABELS[task.status]}
                      </span>
                    </div>

                    <p className={`text-[14px] font-medium leading-snug ${task.status === 'done' ? 'line-through text-[#5a5a72]' : 'text-white'}`}>
                      {task.title}
                    </p>

                    {task.description && (
                      <p className="text-xs text-[#9090a8] mt-1 line-clamp-1">{task.description}</p>
                    )}

                    {/* Progress bar */}
                    {task.progress > 0 && (
                      <div className="mt-2.5">
                        <div className="flex justify-between text-[10px] text-[#5a5a72] mb-1">
                          <span>Progress</span>
                          <span>{task.progress}%</span>
                        </div>
                        <div className="h-1 bg-[#1a1a24] rounded-full overflow-hidden">
                          <div
                            className="h-full rounded-full bg-gradient-to-r from-violet-500 to-blue-500"
                            style={{ width: `${task.progress}%` }}
                          />
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Right side */}
                  <div className="flex flex-col items-end gap-1.5 flex-shrink-0">
                    {dueDate && (
                      <span className={`flex items-center gap-1 text-[11px] ${isOverdue ? 'text-red-400' : 'text-[#5a5a72]'}`}>
                        <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                          <circle cx="5" cy="5" r="4" stroke="currentColor" strokeWidth="1.2"/>
                          <path d="M5 3v2.5l1.5 1" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
                        </svg>
                        {isOverdue ? 'Overdue · ' : ''}{dueDate}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
