import React from 'react';
import { useState, useEffect } from 'react';

const PRIORITIES = ['high', 'medium', 'low'];
const TAGS       = ['Frontend', 'Backend', 'DevOps', 'Design', 'Bug', 'Other'];
const STATUSES   = ['backlog', 'todo', 'inprogress', 'review', 'done'];

const STATUS_LABELS = {
  backlog: 'Backlog', todo: 'To Do', inprogress: 'In Progress',
  review: 'In Review', done: 'Done',
};

const BLANK = {
  title: '', description: '', tag: 'Frontend', priority: 'medium',
  status: 'todo', due_date: '', progress: 0, assignee_name: '',
};

export default function TaskModal({ isOpen, onClose, onSave, initialTask = null, defaultStatus = 'todo' }) {
  const [form, setForm]     = useState(BLANK);
  const [saving, setSaving] = useState(false);
  const [error, setError]   = useState('');

  useEffect(() => {
    if (isOpen) {
      setForm(initialTask
        ? { ...BLANK, ...initialTask }
        : { ...BLANK, status: defaultStatus });
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
      className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="bg-[#17171e] border border-[#2e2e3a] rounded-2xl p-6 w-full max-w-md shadow-2xl animate-[slideUp_.2s_ease]">
        <h2 className="font-[Syne,sans-serif] text-[18px] font-bold tracking-tight text-[#f0f0f5] mb-5">
          {initialTask ? 'Edit task' : 'New task'}
        </h2>

        {error && (
          <div className="mb-4 text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2">
            {error}
          </div>
        )}

        {/* Title */}
        <Field label="Task title">
          <input
            className="tf-input"
            placeholder="What needs to be done?"
            value={form.title}
            onChange={set('title')}
            autoFocus
          />
        </Field>

        {/* Description */}
        <Field label="Description">
          <textarea
            className="tf-input resize-none"
            rows={3}
            placeholder="Optional details…"
            value={form.description}
            onChange={set('description')}
          />
        </Field>

        {/* Row: Priority + Tag */}
        <div className="flex gap-3">
          <Field label="Priority" className="flex-1">
            <Select value={form.priority} onChange={set('priority')}>
              {PRIORITIES.map((p) => <option key={p} value={p}>{p.charAt(0).toUpperCase() + p.slice(1)}</option>)}
            </Select>
          </Field>
          <Field label="Category" className="flex-1">
            <Select value={form.tag} onChange={set('tag')}>
              {TAGS.map((t) => <option key={t} value={t}>{t}</option>)}
            </Select>
          </Field>
        </div>

        {/* Row: Status + Due date */}
        <div className="flex gap-3">
          <Field label="Status" className="flex-1">
            <Select value={form.status} onChange={set('status')}>
              {STATUSES.map((s) => <option key={s} value={s}>{STATUS_LABELS[s]}</option>)}
            </Select>
          </Field>
          <Field label="Due date" className="flex-1">
            <input type="date" className="tf-input" value={form.due_date} onChange={set('due_date')} />
          </Field>
        </div>

        {/* Row: Assignee + Progress */}
        <div className="flex gap-3">
          <Field label="Assignee" className="flex-1">
            <input className="tf-input" placeholder="Name" value={form.assignee_name} onChange={set('assignee_name')} />
          </Field>
          <Field label={`Progress — ${form.progress}%`} className="flex-1">
            <input
              type="range" min="0" max="100" step="5"
              className="w-full mt-2 accent-violet-500"
              value={form.progress}
              onChange={set('progress')}
            />
          </Field>
        </div>

        {/* Footer */}
        <div className="flex gap-2 justify-end mt-5">
          <button
            className="px-4 py-2 rounded-lg border border-[#2e2e3a] text-sm text-[#9090a8] hover:text-white hover:bg-[#25252f] transition-colors"
            onClick={onClose}
          >
            Cancel
          </button>
          <button
            className="px-4 py-2 rounded-lg bg-violet-600 hover:bg-violet-500 text-white text-sm font-medium transition-colors disabled:opacity-50"
            onClick={handleSave}
            disabled={saving}
          >
            {saving ? 'Saving…' : initialTask ? 'Save changes' : 'Create task'}
          </button>
        </div>
      </div>

      <style>{`
        .tf-input {
          width: 100%;
          background: #1e1e28;
          border: 1px solid #2e2e3a;
          border-radius: 8px;
          padding: 8px 12px;
          color: #f0f0f5;
          font-size: 13.5px;
          font-family: 'DM Sans', sans-serif;
          outline: none;
          transition: border-color .12s;
        }
        .tf-input:focus { border-color: #7c6ff7; }
        .tf-input::placeholder { color: #5a5a72; }
        @keyframes slideUp {
          from { transform: translateY(16px); opacity: 0; }
          to   { transform: none;             opacity: 1; }
        }
      `}</style>
    </div>
  );
}

function Field({ label, children, className = '' }) {
  return (
    <div className={`mb-3 ${className}`}>
      <label className="block text-xs font-medium text-[#9090a8] mb-1.5">{label}</label>
      {children}
    </div>
  );
}

function Select({ value, onChange, children }) {
  return (
    <select
      className="tf-input cursor-pointer"
      value={value}
      onChange={onChange}
      style={{ background: '#1e1e28' }}
    >
      {children}
    </select>
  );
}

