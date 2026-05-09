import React from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS }         from '@dnd-kit/utilities';

const PRIORITY_STYLES = {
  high:   { bg: 'bg-red-500/15',    text: 'text-red-400',    dot: 'bg-red-400',    label: 'High'   },
  medium: { bg: 'bg-amber-500/15',  text: 'text-amber-400',  dot: 'bg-amber-400',  label: 'Medium' },
  low:    { bg: 'bg-green-500/15',  text: 'text-green-400',  dot: 'bg-green-400',  label: 'Low'    },
};

const TAG_STYLES = {
  Frontend: 'bg-blue-500/15 text-blue-400',
  Backend:  'bg-violet-500/15 text-violet-400',
  DevOps:   'bg-teal-500/15 text-teal-400',
  Design:   'bg-pink-500/15 text-pink-400',
  Bug:      'bg-orange-500/15 text-orange-400',
};

function Avatar({ name = '', size = 'sm' }) {
  const initials = name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2);
  const dim = size === 'sm' ? 'w-6 h-6 text-[10px]' : 'w-8 h-8 text-xs';
  return (
    <div className={`${dim} rounded-full bg-gradient-to-br from-violet-500 to-blue-500 flex items-center justify-center font-semibold text-white flex-shrink-0`}>
      {initials}
    </div>
  );
}

export default function TaskCard({ task, onEdit, onDelete }) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: task.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.35 : 1,
    zIndex:  isDragging ? 999 : 'auto',
  };

  const priority = PRIORITY_STYLES[task.priority] || PRIORITY_STYLES.medium;
  const tagClass = TAG_STYLES[task.tag] || 'bg-gray-500/15 text-gray-400';

  const dueDate = task.due_date
    ? new Date(task.due_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
    : null;

  const isOverdue = task.due_date && new Date(task.due_date) < new Date() && task.status !== 'done';

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`
        group bg-[#1e1e28] border rounded-xl p-3 cursor-grab select-none
        transition-all duration-150
        ${isDragging
          ? 'border-violet-500 shadow-lg shadow-violet-500/20 cursor-grabbing'
          : 'border-[#2e2e3a] hover:border-[#3a3a48] hover:-translate-y-0.5'}
      `}
      {...attributes}
      {...listeners}
    >
      {/* Tag */}
      <div className="flex items-center justify-between mb-2">
        <span className={`text-[10.5px] font-medium px-2 py-0.5 rounded-full ${tagClass}`}>
          {task.tag}
        </span>
        {/* Actions — visible on hover */}
        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <button
            className="w-5 h-5 rounded flex items-center justify-center text-[#9090a8] hover:text-white hover:bg-[#2e2e3a] transition-colors"
            onClick={(e) => { e.stopPropagation(); onEdit(task); }}
            onPointerDown={(e) => e.stopPropagation()}
            title="Edit"
          >
            <svg width="10" height="10" viewBox="0 0 12 12" fill="none">
              <path d="M8.5 1.5a1.414 1.414 0 012 2L3 11H1V9L8.5 1.5z" stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round"/>
            </svg>
          </button>
          <button
            className="w-5 h-5 rounded flex items-center justify-center text-[#9090a8] hover:text-red-400 hover:bg-red-500/10 transition-colors"
            onClick={(e) => { e.stopPropagation(); onDelete(task.id); }}
            onPointerDown={(e) => e.stopPropagation()}
            title="Delete"
          >
            <svg width="10" height="10" viewBox="0 0 12 12" fill="none">
              <path d="M2 3h8M5 3V2h2v1M4 3v7h4V3H4z" stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round"/>
            </svg>
          </button>
        </div>
      </div>

      {/* Title */}
      <p className={`text-[13.5px] font-medium leading-snug mb-1.5 ${task.status === 'done' ? 'line-through text-[#5a5a72]' : 'text-[#f0f0f5]'}`}>
        {task.title}
      </p>

      {/* Description */}
      {task.description && (
        <p className="text-xs text-[#9090a8] leading-relaxed mb-2 line-clamp-2">
          {task.description}
        </p>
      )}

      {/* Progress bar */}
      {task.progress > 0 && (
        <div className="mb-2.5">
          <div className="flex justify-between text-[10.5px] text-[#5a5a72] mb-1">
            <span>Progress</span>
            <span>{task.progress}%</span>
          </div>
          <div className="h-1 bg-[#2e2e3a] rounded-full overflow-hidden">
            <div
              className="h-full rounded-full bg-gradient-to-r from-violet-500 to-blue-500 transition-all duration-500"
              style={{ width: `${task.progress}%` }}
            />
          </div>
        </div>
      )}

      {/* Footer */}
      <div className="flex items-center gap-2 mt-2">
        {/* Priority */}
        <span className={`flex items-center gap-1 text-[10.5px] font-medium px-2 py-0.5 rounded-full ${priority.bg} ${priority.text}`}>
          <span className={`w-1.5 h-1.5 rounded-full ${priority.dot}`} />
          {priority.label}
        </span>

        {/* Due date */}
        {dueDate && (
          <span className={`ml-auto flex items-center gap-1 text-[10.5px] ${isOverdue ? 'text-red-400' : 'text-[#5a5a72]'}`}>
            <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
              <circle cx="5" cy="5" r="4" stroke="currentColor" strokeWidth="1.2"/>
              <path d="M5 3v2.5l1.5 1" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
            </svg>
            {dueDate}
          </span>
        )}

        {/* Assignee */}
        {task.assignee_name && (
          <Avatar name={task.assignee_name} size="sm" />
        )}
      </div>
    </div>
  );
}

