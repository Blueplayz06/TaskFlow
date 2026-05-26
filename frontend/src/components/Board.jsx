import { useState, useEffect, useRef, useCallback } from "react";
import api from "../api/client";
import TaskModal from "./TaskModal";

// ─── constants ────────────────────────────────────────────────────────────────
const COLUMNS = [
  { key: "todo", label: "To do" },
  { key: "inprogress", label: "In progress" },
  { key: "review", label: "Review" },
  { key: "done", label: "Done" },
];

const TAG_COLORS = {
  bug: { bg: "#FCEBEB", tc: "#791F1F" },
  feature: { bg: "#E6F1FB", tc: "#0C447C" },
  ui: { bg: "#EEEDFE", tc: "#3C3489" },
  api: { bg: "#E1F5EE", tc: "#085041" },
  design: { bg: "#FAEEDA", tc: "#633806" },
};

const AVATAR_COLORS = [
  { bg: "#E6F1FB", tc: "#0C447C" },
  { bg: "#EAF3DE", tc: "#27500A" },
  { bg: "#FAEEDA", tc: "#633806" },
  { bg: "#FBEAF0", tc: "#72243E" },
  { bg: "#EEEDFE", tc: "#3C3489" },
];

// ─── helpers ──────────────────────────────────────────────────────────────────
function avatarColor(name = "") {
  const idx = name.charCodeAt(0) % AVATAR_COLORS.length;
  return AVATAR_COLORS[idx];
}

function initials(name = "") {
  return name.split(" ").map(w => w[0]).join("").slice(0, 2).toUpperCase() || "?";
}

function normalizeStatus(s = "") {
  const m = s.toLowerCase().replace(/[_\s]/g, "");
  if (m === "inprogress" || m === "in_progress") return "inprogress";
  if (m === "done" || m === "complete" || m === "completed") return "done";
  if (m === "review" || m === "inreview") return "review";
  return "todo";
}

// ─── TaskCard ─────────────────────────────────────────────────────────────────
function TaskCard({ task, onDragStart, onDragEnd, onClick }) {
  const tag = TAG_COLORS[task.tag?.toLowerCase()] || TAG_COLORS.feature;
  const av = avatarColor(task.assignee);

  return (
    <div
      draggable
      onDragStart={e => onDragStart(e, task)}
      onDragEnd={onDragEnd}
      onClick={() => onClick(task)}
      style={{
        background: "var(--color-background-primary)",
        border: "0.5px solid var(--color-border-tertiary)",
        borderRadius: "var(--border-radius-md)",
        padding: "10px 12px",
        marginBottom: 8,
        cursor: "grab",
        userSelect: "none",
      }}
    >
      <div style={{ fontSize: 13, fontWeight: 500, color: "var(--color-text-primary)", marginBottom: 8 }}>
        {task.title}
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
        {task.tag && (
          <span style={{
            fontSize: 11, padding: "2px 7px", borderRadius: 10,
            fontWeight: 500, background: tag.bg, color: tag.tc,
          }}>
            {task.tag}
          </span>
        )}
        {task.due_date && (
          <span style={{ fontSize: 11, color: "var(--color-text-tertiary)" }}>
            {new Date(task.due_date).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}
          </span>
        )}
        {task.assignee && (
          <div style={{
            width: 22, height: 22, borderRadius: "50%",
            background: av.bg, color: av.tc,
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 10, fontWeight: 500, marginLeft: "auto", flexShrink: 0,
          }}>
            {initials(task.assignee)}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Column ───────────────────────────────────────────────────────────────────
function Column({ col, tasks, onDragStart, onDragEnd, onDrop, onDragOver, onDragLeave, isDragOver, onCardClick, onAddTask }) {
  return (
    <div
      onDragOver={onDragOver}
      onDrop={e => onDrop(e, col.key)}
      onDragLeave={onDragLeave}
      style={{
        background: isDragOver ? "var(--color-background-info)" : "var(--color-background-secondary)",
        borderRadius: "var(--border-radius-lg)",
        padding: 10,
        minHeight: 200,
        transition: "background .15s",
        display: "flex",
        flexDirection: "column",
      }}
    >
      {/* header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10, padding: "0 2px" }}>
        <span style={{ fontSize: 13, fontWeight: 500, color: "var(--color-text-primary)" }}>{col.label}</span>
        <span style={{
          fontSize: 11, padding: "1px 7px", borderRadius: 10,
          background: "var(--color-background-primary)",
          border: "0.5px solid var(--color-border-tertiary)",
          color: "var(--color-text-secondary)",
        }}>
          {tasks.length}
        </span>
      </div>

      {/* cards */}
      <div style={{ flex: 1 }}>
        {tasks.map(task => (
          <TaskCard
            key={task.id}
            task={task}
            onDragStart={onDragStart}
            onDragEnd={onDragEnd}
            onClick={onCardClick}
          />
        ))}
      </div>

      {/* add task */}
      <button
        onClick={() => onAddTask(col.key)}
        style={{
          width: "100%", marginTop: 8, padding: "6px 0",
          fontSize: 12, color: "var(--color-text-secondary)",
          background: "transparent", border: "0.5px dashed var(--color-border-secondary)",
          borderRadius: "var(--border-radius-md)", cursor: "pointer",
        }}
      >
        + Add task
      </button>
    </div>
  );
}

// ─── Board ────────────────────────────────────────────────────────────────────
export default function Board() {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [dragOverCol, setDragOverCol] = useState(null);
  const [search, setSearch] = useState("");
  const [filterTag, setFilterTag] = useState("all");
  const [modalTask, setModalTask] = useState(null); // null | task | {status} for new
  const draggingId = useRef(null);

  // ── fetch ──
  useEffect(() => {
    const projectId = localStorage.getItem("activeProject");
    const url = projectId ? `/tasks?project_id=${projectId}` : "/tasks";
    api.get(url)
      .then(res => {
        const raw = Array.isArray(res.data) ? res.data : res.data.tasks || [];
        setTasks(raw.map(t => ({ ...t, status: normalizeStatus(t.status) })));
      })
      .catch(err => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  // ── drag handlers ──
  const handleDragStart = useCallback((e, task) => {
    draggingId.current = task.id;
    e.dataTransfer.effectAllowed = "move";
  }, []);

  const handleDragEnd = useCallback(() => {
    draggingId.current = null;
    setDragOverCol(null);
  }, []);

  const handleDragOver = useCallback((e) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
  }, []);

  const handleDrop = useCallback(async (e, newStatus) => {
    e.preventDefault();
    setDragOverCol(null);
    const id = draggingId.current;
    if (!id) return;

    const task = tasks.find(t => t.id === id);
    if (!task || task.status === newStatus) return;

    // optimistic update
    setTasks(prev => prev.map(t => t.id === id ? { ...t, status: newStatus } : t));

    try {
      await api.patch(`/tasks/${id}`, { status: newStatus });
    } catch {
      // revert on failure
      setTasks(prev => prev.map(t => t.id === id ? { ...t, status: task.status } : t));
    }
  }, [tasks]);

  // ── modal handlers ──
  const handleSaveTask = useCallback(async (data) => {
    if (data.id) {
      const res = await api.put(`/tasks/${data.id}`, data);
      setTasks(prev => prev.map(t => t.id === data.id ? { ...t, ...res.data } : t));
    } else {
      const res = await api.post("/tasks", data);
      setTasks(prev => [...prev, { ...res.data, status: normalizeStatus(res.data.status) }]);
    }
    // no setModalTask(null) here — TaskModal calls onClose() itself after saving
  }, []);

  const handleDeleteTask = useCallback(async (id) => {
    try {
      await api.delete(`/tasks/${id}`);
      setTasks(prev => prev.filter(t => t.id !== id));
    } catch (err) {
      console.error("Delete task failed:", err);
    }
    setModalTask(null);
  }, []);

  // ── filtered tasks ──
  const allTags = [...new Set(tasks.map(t => t.tag).filter(Boolean))];

  const filtered = tasks.filter(t => {
    const matchSearch = !search || t.title?.toLowerCase().includes(search.toLowerCase());
    const matchTag = filterTag === "all" || t.tag === filterTag;
    return matchSearch && matchTag;
  });

  // ── render ──
  return (
    <div style={{ padding: "24px 28px", fontFamily: "inherit" }}>

      {/* toolbar */}
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: "1.25rem", flexWrap: "wrap" }}>
        <h1 style={{ fontSize: 20, fontWeight: 500, color: "var(--color-text-primary)", flex: 1 }}>Board</h1>

        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search tasks…"
          style={{
            padding: "6px 12px", fontSize: 13, width: 200,
            border: "0.5px solid var(--color-border-secondary)",
            borderRadius: "var(--border-radius-md)",
            background: "var(--color-background-primary)",
            color: "var(--color-text-primary)",
          }}
        />

        {/* tag filter */}
        <div style={{ display: "flex", gap: 6 }}>
          {["all", ...allTags].map(tag => (
            <button key={tag} onClick={() => setFilterTag(tag)} style={{
              padding: "5px 11px", fontSize: 12, cursor: "pointer",
              border: "0.5px solid var(--color-border-secondary)",
              borderRadius: "var(--border-radius-md)",
              background: filterTag === tag ? "var(--color-background-secondary)" : "transparent",
              fontWeight: filterTag === tag ? 500 : 400,
              color: filterTag === tag ? "var(--color-text-primary)" : "var(--color-text-secondary)",
            }}>
              {tag === "all" ? "All" : tag}
            </button>
          ))}
        </div>
      </div>

      {loading && (
        <div style={{ textAlign: "center", padding: "3rem", color: "var(--color-text-secondary)" }}>Loading…</div>
      )}
      {error && (
        <div style={{ padding: "1rem", borderRadius: "var(--border-radius-md)", background: "var(--color-background-danger)", color: "var(--color-text-danger)", fontSize: 13 }}>
          {error}
        </div>
      )}

      {/* board */}
      {!loading && !error && (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12, alignItems: "start" }}>
          {COLUMNS.map(col => (
            <Column
              key={col.key}
              col={col}
              tasks={filtered.filter(t => t.status === col.key)}
              onDragStart={handleDragStart}
              onDragEnd={handleDragEnd}
              onDragOver={handleDragOver}
              onDrop={handleDrop}
              onDragLeave={() => setDragOverCol(null)}
              isDragOver={dragOverCol === col.key}
              onCardClick={task => setModalTask(task)}
              onAddTask={status => setModalTask({ status })}
            />
          ))}
        </div>
      )}

      {/* task modal — reuse your existing one */}
      {modalTask !== null && (
        <TaskModal
          isOpen={modalTask !== null}
          initialTask={modalTask?.id ? modalTask : null}
          defaultStatus={modalTask?.status || 'todo'}
          onSave={handleSaveTask}
          onClose={() => setModalTask(null)}
        />
      )}
    </div>
  );
}
