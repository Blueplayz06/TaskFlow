import React, { useState, useEffect } from 'react';

const PRIORITIES = ['high', 'medium', 'low'];
const TAGS       = ['Frontend', 'Backend', 'DevOps', 'Design', 'Bug', 'Other'];
const STATUSES   = ['backlog', 'todo', 'inprogress', 'review', 'done'];
const STATUS_LABELS = { backlog: 'Backlog', todo: 'To Do', inprogress: 'In Progress', review: 'In Review', done: 'Done' };

const BLANK = { title: '', description: '', tag: 'Design', priority: 'medium', status: 'todo', due_date: '', progress: 0, assignee_name: '' };

export default function TaskModal({ isOpen, onClose, onSave, initialTask = null, defaultStatus = 'todo' }) {
  const [form, setForm]     = useState(BLANK);
  const [saving, setSaving] = useState(false);
  const [error, setError]   = useState('');

  useEffect(() => {
    if (isOpen) {
      setForm(initialTask ? { ...BLANK, ...initialTask } : { ...BLANK, status: defaultStatus });
      setError('');
    }
  }, [isOpen, initialTask, defaultStatus]);

  if (!isOpen) return null;

  const set = (field) => (e) => setForm((f) => ({ ...f, [field]: e.target.value }));

  const handleSave = async () => {
    if (!form.title.trim()) { setError('Title is required'); return; }
    setSaving(true);
    try {
      await onSave(form);
      onClose();
    } catch (err) {
      setError(err.response?.data?.message || 'Something went wrong');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div
      className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="bg-[#11111a] border border-[#2a2a38] rounded-2xl w-full max-w-lg shadow-2xl shadow-black/60"
        style={{ animation: 'slideUp .2s ease' }}>

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-[#1e1e2a]">
          <h2 className="text-[16px] font-semibold text-white" style={{ fontFamily: 'Syne, sans-serif' }}>
            {initialTask ? 'Edit task' : 'New task'}
          </h2>
          <button onClick={onClose} className="w-7 h-7 rounded-lg flex items-center justify-center text-[#5a5a72] hover:text-white hover:bg-[#1e1e2a] transition-colors">
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <path d="M2 2l10 10M12 2L2 12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
            </svg>
          </button>
        </div>

        {/* Body */}
        <div className="p-5 space-y-4">
          {error && (
            <div className="text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded-xl px-3 py-2">{error}</div>
          )}

          {/* Title */}
          <div>
            <label className="block text-xs font-medium text-[#9090a8] mb-1.5">Task Title</label>
            <input
              className="tf-input"
              placeholder="e.g., Update user authentication flow"
              value={form.title}
              onChange={set('title')}
              autoFocus
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-medium text-[#9090a8] mb-1.5">Description</label>
            <textarea
              className="tf-input resize-none"
              rows={4}
              placeholder="Provide details about the task..."
              value={form.description}
              onChange={set('description')}
            />
          </div>

          {/* Priority + Category */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-[#9090a8] mb-1.5">Priority</label>
              <Select value={form.priority} onChange={set('priority')}>
                {PRIORITIES.map(p => <option key={p} value={p}>{p.charAt(0).toUpperCase() + p.slice(1)}</option>)}
              </Select>
            </div>
            <div>
              <label className="block text-xs font-medium text-[#9090a8] mb-1.5">Category</label>
              <Select value={form.tag} onChange={set('tag')}>
                {TAGS.map(t => <option key={t} value={t}>{t}</option>)}
              </Select>
            </div>
          </div>

          {/* Status + Due date */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-[#9090a8] mb-1.5">Status</label>
              <Select value={form.status} onChange={set('status')}>
                {STATUSES.map(s => <option key={s} value={s}>{STATUS_LABELS[s]}</option>)}
              </Select>
            </div>
            <div>
              <label className="block text-xs font-medium text-[#9090a8] mb-1.5">Due Date</label>
              <div className="relative">
                <input type="date" className="tf-input pr-9" value={form.due_date} onChange={set('due_date')} />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[#5a5a72]">
                  <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                    <rect x="1" y="2.5" width="12" height="10" rx="1.5" stroke="currentColor" strokeWidth="1.2"/>
                    <path d="M1 6h12M4.5 1v3M9.5 1v3" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
                  </svg>
                </span>
              </div>
            </div>
          </div>

          {/* Assignee + Progress */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-[#9090a8] mb-1.5">Assignee</label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[#5a5a72]">
                  <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
                    <circle cx="6.5" cy="4" r="2.5" stroke="currentColor" strokeWidth="1.2"/>
                    <path d="M1.5 11c0-2.5 2.24-4 5-4s5 1.5 5 4" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
                  </svg>
                </span>
                <input className="tf-input pl-8" placeholder="Name" value={form.assignee_name} onChange={set('assignee_name')} />
              </div>
            </div>
            <div>
              <label className="block text-xs font-medium text-[#9090a8] mb-1.5">
                Initial Progress <span className="text-violet-400">{form.progress}%</span>
              </label>
              <div className="flex items-center gap-2 mt-3">
                <input
                  type="range" min="0" max="100" step="5"
                  className="w-full accent-violet-500"
                  value={form.progress}
                  onChange={set('progress')}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-2.5 px-5 py-4 border-t border-[#1e1e2a]">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg text-sm text-[#9090a8] hover:text-white hover:bg-[#1e1e2a] transition-colors border border-[#2a2a38]"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="px-4 py-2 rounded-lg bg-violet-600 hover:bg-violet-500 text-white text-sm font-medium transition-colors disabled:opacity-50 shadow-lg shadow-violet-600/20"
          >
            {saving ? 'Saving…' : initialTask ? 'Save changes' : 'Create task'}
          </button>
        </div>
      </div>

      <style>{`
        .tf-input {
          width: 100%;
          background: #0f0f18;
          border: 1px solid #2a2a38;
          border-radius: 10px;
          padding: 9px 12px;
          color: #f0f0f5;
          font-size: 13.5px;
          font-family: 'DM Sans', sans-serif;
          outline: none;
          transition: border-color .15s;
        }
        .tf-input:focus { border-color: #7c6ff7; }
        .tf-input::placeholder { color: #3a3a52; }
        @keyframes slideUp {
          from { transform: translateY(16px); opacity: 0; }
          to   { transform: none; opacity: 1; }
        }
      `}</style>
    </div>
  );
}

function Select({ value, onChange, children }) {
  return (
    <select
      value={value}
      onChange={onChange}
      className="tf-input cursor-pointer appearance-none"
      style={{ background: '#0f0f18' }}
    >
      {children}
    </select>
  );
}
