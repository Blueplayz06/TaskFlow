import React from 'react';
import { useDroppable }    from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import TaskCard from './TaskCard';

const COL_META = {
  backlog:    { color: '#5a5a72', label: 'Backlog'      },
  todo:       { color: '#4fa3f7', label: 'To Do'        },
  inprogress: { color: '#7c6ff7', label: 'In Progress'  },
  review:     { color: '#f5a623', label: 'In Review'    },
  done:       { color: '#22c988', label: 'Done'         },
};

export default function Column({ id, tasks = [], onEdit, onDelete, onAddTask }) {
  const { setNodeRef, isOver } = useDroppable({ id });
  const meta = COL_META[id] || { color: '#5a5a72', label: id };

  return (
    <div className="flex flex-col w-[260px] flex-shrink-0 bg-[#17171e] border border-[#2e2e3a] rounded-2xl overflow-hidden max-h-full">
      {/* Header */}
      <div className="flex items-center justify-between px-3.5 py-3 border-b border-[#2e2e3a]">
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: meta.color }} />
          <span className="text-[13px] font-semibold font-[Syne,sans-serif] tracking-tight text-[#f0f0f5]">
            {meta.label}
          </span>
          <span className="text-[11px] text-[#5a5a72] bg-[#25252f] rounded-full px-2 py-0.5 font-medium">
            {tasks.length}
          </span>
        </div>
        <button
          className="w-6 h-6 rounded-md border border-[#2e2e3a] text-[#9090a8] hover:text-white hover:bg-[#25252f] flex items-center justify-center text-lg leading-none transition-colors"
          onClick={() => onAddTask(id)}
          title={`Add task to ${meta.label}`}
        >
          +
        </button>
      </div>

      {/* Sortable body */}
      <div
        ref={setNodeRef}
        className={`
          flex-1 overflow-y-auto p-2.5 flex flex-col gap-2 min-h-[80px] transition-colors
          ${isOver ? 'bg-violet-500/5' : ''}
        `}
        style={{ scrollbarWidth: 'thin', scrollbarColor: '#2e2e3a transparent' }}
      >
        <SortableContext items={tasks.map((t) => t.id)} strategy={verticalListSortingStrategy}>
          {tasks.map((task) => (
            <TaskCard
              key={task.id}
              task={task}
              onEdit={onEdit}
              onDelete={onDelete}
            />
          ))}
        </SortableContext>

        {/* Drop hint */}
        {isOver && tasks.length === 0 && (
          <div className="border border-dashed border-violet-500/50 rounded-xl p-4 text-center text-xs text-violet-400/70">
            Drop here
          </div>
        )}

        {/* Empty state */}
        {!isOver && tasks.length === 0 && (
          <div className="border border-dashed border-[#2e2e3a] rounded-xl p-4 text-center text-xs text-[#5a5a72]">
            No tasks
          </div>
        )}
      </div>
    </div>
  );
}

