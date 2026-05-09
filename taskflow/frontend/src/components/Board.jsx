import React from 'react';
import { useState, useMemo } from 'react';
import {
  DndContext,
  PointerSensor,
  KeyboardSensor,
  useSensor,
  useSensors,
  DragOverlay,
  closestCorners,
} from '@dnd-kit/core';
import { sortableKeyboardCoordinates, arrayMove } from '@dnd-kit/sortable';
import Column    from './Column';
import TaskCard  from './TaskCard';
import TaskModal from './TaskModal';
import { useTasks } from '../hooks/useTasks';

const COLUMNS = ['backlog', 'todo', 'inprogress', 'review', 'done'];

const PRIORITY_FILTER_OPTIONS = [
  { value: 'all',    label: 'All'        },
  { value: 'high',   label: 'High'       },
  { value: 'medium', label: 'Medium'     },
  { value: 'low',    label: 'Low'        },
];

export default function Board({ projectId }) {
  const { tasks, loading, error, addTask, editTask, removeTask, moveTask } = useTasks(projectId);

  const [activeTask,    setActiveTask]    = useState(null);
  const [modalOpen,     setModalOpen]     = useState(false);
  const [editingTask,   setEditingTask]   = useState(null);
  const [defaultStatus, setDefaultStatus] = useState('todo');
  const [filter,        setFilter]        = useState('all');
  const [search,        setSearch]        = useState('');

  // ── Sensors (pointer + keyboard)
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  // ── Filtered tasks
  const filteredTasks = useMemo(() => {
    return tasks.filter((t) => {
      const matchPriority = filter === 'all' || t.priority === filter;
      const q = search.toLowerCase();
      const matchSearch = !q || t.title.toLowerCase().includes(q) || t.tag?.toLowerCase().includes(q);
      return matchPriority && matchSearch;
    });
  }, [tasks, filter, search]);

  const tasksByCol = useMemo(() => {
    const map = {};
    COLUMNS.forEach((c) => { map[c] = []; });
    filteredTasks.forEach((t) => {
      if (map[t.status]) map[t.status].push(t);
    });
    // sort each column by sort_order
    COLUMNS.forEach((c) => map[c].sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0)));
    return map;
  }, [filteredTasks]);

  // ── Stats
  const stats = useMemo(() => ({
    total:    tasks.length,
    progress: tasks.filter((t) => t.status === 'inprogress').length,
    done:     tasks.filter((t) => t.status === 'done').length,
    high:     tasks.filter((t) => t.priority === 'high').length,
  }), [tasks]);

  // ── DnD handlers
  function handleDragStart({ active }) {
    setActiveTask(tasks.find((t) => t.id === active.id) || null);
  }

  function handleDragOver({ active, over }) {
    if (!over) return;
    const fromCol = active.data.current?.sortable?.containerId;
    const toCol   = over.data.current?.sortable?.containerId ?? over.id;
    if (!fromCol || fromCol === toCol) return;
    moveTask(active.id, toCol, over.id === toCol ? 0 : tasks.findIndex((t) => t.id === over.id));
  }

  function handleDragEnd({ active, over }) {
    setActiveTask(null);
    if (!over || active.id === over.id) return;
    const fromCol = active.data.current?.sortable?.containerId;
    const toCol   = over.data.current?.sortable?.containerId ?? over.id;
    if (!fromCol) return;
    const colTasks = tasksByCol[toCol];
    const oldIdx = colTasks.findIndex((t) => t.id === active.id);
    const newIdx = colTasks.findIndex((t) => t.id === over.id);
    if (oldIdx !== -1 && newIdx !== -1) {
      const reordered = arrayMove(colTasks, oldIdx, newIdx);
      reordered.forEach((t, i) => moveTask(t.id, toCol, i));
    }
  }

  // ── Modal helpers
  const openCreate = (status = 'todo') => {
    setEditingTask(null);
    setDefaultStatus(status);
    setModalOpen(true);
  };
  const openEdit = (task) => { setEditingTask(task); setModalOpen(true); };
  const handleSave = (form) => editingTask ? editTask(editingTask.id, form) : addTask(form);
  const handleDelete = (id) => { if (window.confirm('Delete this task?')) removeTask(id); };

  if (loading) return (
    <div className="flex-1 flex items-center justify-center">
      <div className="w-8 h-8 border-2 border-violet-500 border-t-transparent rounded-full animate-spin" />
    </div>
  );
  if (error) return (
    <div className="flex-1 flex items-center justify-center text-red-400 text-sm">{error}</div>
  );

  return (
    <>
      {/* ── Stats row ── */}
      <div className="flex gap-3 px-6 pt-5 pb-1">
        {[
          { num: stats.total,    label: 'Total tasks',  color: '#9090a8' },
          { num: stats.progress, label: 'In progress',  color: '#7c6ff7' },
          { num: stats.done,     label: 'Completed',    color: '#22c988' },
          { num: stats.high,     label: 'High priority',color: '#f25c6e' },
        ].map(({ num, label, color }) => (
          <div key={label} className="flex-1 bg-[#17171e] border border-[#2e2e3a] rounded-xl px-4 py-3">
            <div className="text-2xl font-bold font-[Syne,sans-serif] leading-none" style={{ color }}>{num}</div>
            <div className="text-xs text-[#9090a8] mt-1">{label}</div>
          </div>
        ))}
      </div>

      {/* ── Filter / search bar ── */}
      <div className="flex items-center gap-2 px-6 py-3">
        {PRIORITY_FILTER_OPTIONS.map((opt) => (
          <button
            key={opt.value}
            onClick={() => setFilter(opt.value)}
            className={`px-3 py-1 rounded-full text-[12.5px] border transition-colors
              ${filter === opt.value
                ? 'bg-violet-500/15 border-violet-500 text-violet-300'
                : 'border-[#2e2e3a] text-[#9090a8] hover:border-[#3a3a48] hover:text-white bg-transparent'}
            `}
          >
            {opt.label}
          </button>
        ))}
        <div className="ml-auto flex items-center gap-2 bg-[#17171e] border border-[#2e2e3a] rounded-lg px-3 py-1.5 min-w-[180px]">
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
        <button
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-violet-600 hover:bg-violet-500 text-white text-sm font-medium transition-colors"
          onClick={() => openCreate()}
        >
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
            <path d="M6 1v10M1 6h10" stroke="white" strokeWidth="1.5" strokeLinecap="round"/>
          </svg>
          New task
        </button>
      </div>

      {/* ── Kanban board ── */}
      <DndContext
        sensors={sensors}
        collisionDetection={closestCorners}
        onDragStart={handleDragStart}
        onDragOver={handleDragOver}
        onDragEnd={handleDragEnd}
      >
        <div className="flex gap-3.5 px-6 pb-6 overflow-x-auto flex-1" style={{ scrollbarWidth: 'thin', scrollbarColor: '#2e2e3a transparent' }}>
          {COLUMNS.map((colId) => (
            <Column
              key={colId}
              id={colId}
              tasks={tasksByCol[colId]}
              onEdit={openEdit}
              onDelete={handleDelete}
              onAddTask={openCreate}
            />
          ))}
        </div>

        {/* Drag overlay — ghost card while dragging */}
        <DragOverlay>
          {activeTask && (
            <div className="rotate-1 scale-105 shadow-2xl shadow-violet-500/20">
              <TaskCard task={activeTask} onEdit={() => {}} onDelete={() => {}} />
            </div>
          )}
        </DragOverlay>
      </DndContext>

      {/* ── Task modal ── */}
      <TaskModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        onSave={handleSave}
        initialTask={editingTask}
        defaultStatus={defaultStatus}
      />
    </>
  );
}

