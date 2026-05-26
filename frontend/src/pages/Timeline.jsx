import { useState, useEffect, useMemo } from "react";
import api from "../api/client";

// ─── constants ────────────────────────────────────────────────────────────────
const MONTHS = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
const NUM_MONTHS = 6; // visible window
const STATUS_COLORS = {
  todo:       { bar: "#378ADD", light: "#E6F1FB" },
  inprogress: { bar: "#1D9E75", light: "#E1F5EE" },
  done:       { bar: "#639922", light: "#EAF3DE" },
  overdue:    { bar: "#E24B4A", light: "#FCEBEB" },
};
const VIEW_OPTIONS = ["Week", "Month", "Quarter"];

// ─── helpers ──────────────────────────────────────────────────────────────────
function taskToGantt(task, startDate) {
  const start = new Date(task.due_date || task.created_at);
  // mock end = start + estimated_hours days (fallback 3 days)
  const hours = task.estimated_hours || 24;
  const end   = new Date(start.getTime() + hours * 3600 * 1000);

  const origin    = startDate.getTime();
  const windowMs  = NUM_MONTHS * 30 * 24 * 3600 * 1000;

  const startPct = Math.max(0, ((start - origin) / windowMs) * 100);
  const endPct   = Math.min(100, ((end   - origin) / windowMs) * 100);

  const now    = Date.now();
  const status = task.status === "done" ? "done"
    : task.status === "inprogress" || task.status === "in_progress" ? "inprogress"
    : (end < now && task.status !== "done") ? "overdue"
    : "todo";

  return { ...task, startPct, widthPct: Math.max(1, endPct - startPct), status };
}

function todayPct(startDate) {
  const windowMs = NUM_MONTHS * 30 * 24 * 3600 * 1000;
  return Math.min(100, Math.max(0, (Date.now() - startDate.getTime()) / windowMs * 100));
}

// ─── sub-components ──────────────────────────────────────────────────────────

function SummaryCards({ tasks }) {
  const total      = tasks.length;
  const inProgress = tasks.filter(t => t.status === "inprogress").length;
  const done       = tasks.filter(t => t.status === "done").length;
  const overdue    = tasks.filter(t => t.status === "overdue").length;

  return (
    <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:10, marginBottom:"1.25rem" }}>
      {[
        { label:"Total tasks",   val: total,      color: "var(--color-text-primary)" },
        { label:"In progress",   val: inProgress, color: "var(--color-text-primary)" },
        { label:"Completed",     val: done,       color: "#639922" },
        { label:"Overdue",       val: overdue,    color: "#E24B4A" },
      ].map(({ label, val, color }) => (
        <div key={label} style={{
          background:"var(--color-background-secondary)",
          borderRadius:"var(--border-radius-md)",
          padding:"12px 14px",
        }}>
          <div style={{ fontSize:12, color:"var(--color-text-secondary)", marginBottom:4 }}>{label}</div>
          <div style={{ fontSize:22, fontWeight:500, color }}>{val}</div>
        </div>
      ))}
    </div>
  );
}

function GanttBar({ task, todayLeft }) {
  const [hovered, setHovered] = useState(false);
  const color = STATUS_COLORS[task.status] || STATUS_COLORS.todo;

  return (
    <div style={{ position:"relative", width:"100%", height:48, display:"flex", alignItems:"center" }}>
      {/* month lane gridlines */}
      <div style={{ position:"absolute", inset:0, display:"flex" }}>
        {Array.from({ length: NUM_MONTHS }).map((_, i) => (
          <div key={i} style={{ flex:1, borderRight: i < NUM_MONTHS-1 ? "0.5px solid var(--color-border-tertiary)" : "none" }} />
        ))}
      </div>

      {/* today line */}
      <div style={{
        position:"absolute", top:0, bottom:0,
        left:`${todayLeft}%`, width:1.5,
        background:"#E24B4A", opacity:.7, zIndex:2,
      }} />

      {/* task bar */}
      <div
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        title={`${task.title} — ${task.status}`}
        style={{
          position:"absolute",
          left:`${task.startPct}%`,
          width:`${task.widthPct}%`,
          height:24,
          borderRadius:4,
          background: color.bar,
          filter: hovered ? "brightness(1.12)" : "brightness(1)",
          cursor:"pointer",
          zIndex:3,
          display:"flex", alignItems:"center",
          padding:"0 8px",
          overflow:"hidden",
          transition:"filter .15s",
          boxSizing:"border-box",
        }}
      >
        {/* progress overlay */}
        {task.progress != null && (
          <div style={{
            position:"absolute", left:0, top:0, bottom:0,
            width:`${task.progress}%`,
            background:"rgba(255,255,255,.3)",
            borderRadius:4,
          }} />
        )}
        <span style={{ fontSize:11, fontWeight:500, color:"#fff", whiteSpace:"nowrap", overflow:"hidden", textOverflow:"ellipsis", zIndex:1 }}>
          {task.title}
        </span>
      </div>
    </div>
  );
}

function GanttRow({ task, todayLeft }) {
  const color = STATUS_COLORS[task.status] || STATUS_COLORS.todo;
  return (
    <div style={{
      display:"grid", gridTemplateColumns:"200px 1fr",
      borderBottom:"0.5px solid var(--color-border-tertiary)",
    }}>
      {/* task name */}
      <div style={{
        padding:"6px 16px",
        borderRight:"0.5px solid var(--color-border-tertiary)",
        display:"flex", alignItems:"center", gap:8, minHeight:48,
      }}>
        <div style={{ width:8, height:8, borderRadius:"50%", background:color.bar, flexShrink:0 }} />
        <div style={{ overflow:"hidden" }}>
          <div style={{ fontSize:13, color:"var(--color-text-primary)", whiteSpace:"nowrap", overflow:"hidden", textOverflow:"ellipsis" }}>
            {task.title}
          </div>
          {task.assignee && (
            <div style={{ fontSize:11, color:"var(--color-text-tertiary)" }}>{task.assignee}</div>
          )}
        </div>
      </div>

      {/* bar column */}
      <GanttBar task={task} todayLeft={todayLeft} />
    </div>
  );
}

// ─── main page ────────────────────────────────────────────────────────────────
export default function Timeline() {
  const [tasks,      setTasks]      = useState([]);
  const [loading,    setLoading]    = useState(true);
  const [error,      setError]      = useState(null);
  const [filter,     setFilter]     = useState("all");
  const [view,       setView]       = useState("Month");
  const [startDate]                 = useState(() => {
    const d = new Date();
    d.setDate(1);
    d.setMonth(d.getMonth() - 1); // one month back
    return d;
  });

  // ── fetch tasks ──
  useEffect(() => {
    const projectId = localStorage.getItem("activeProject");
    const url = projectId ? `/tasks?project_id=${projectId}` : "/tasks";
    api.get(url)
      .then(res => {
        const raw = Array.isArray(res.data) ? res.data : res.data.tasks || [];
        setTasks(raw.map(t => taskToGantt(t, startDate)));
      })
      .catch(err => setError(err.message))
      .finally(() => setLoading(false));
  }, [startDate]);

  // ── derived ──
  const monthLabels = useMemo(() => (
    Array.from({ length: NUM_MONTHS }, (_, i) => MONTHS[(startDate.getMonth() + i) % 12])
  ), [startDate]);

  const todayLeft = useMemo(() => todayPct(startDate), [startDate]);

  const filtered = useMemo(() => {
    if (filter === "all") return tasks;
    return tasks.filter(t => t.status === filter);
  }, [tasks, filter]);

  const summary = useMemo(() => ({
    total:      tasks.length,
    inprogress: tasks.filter(t => t.status === "inprogress").length,
    done:       tasks.filter(t => t.status === "done").length,
    overdue:    tasks.filter(t => t.status === "overdue").length,
  }), [tasks]);

  // ── render ──
  return (
    <div style={{ padding:"24px 28px", fontFamily:"inherit", maxWidth:"100%" }}>

      {/* header */}
      <div style={{ display:"flex", alignItems:"center", gap:12, marginBottom:"1.25rem", flexWrap:"wrap" }}>
        <h1 style={{ fontSize:20, fontWeight:500, flex:1, color:"var(--color-text-primary)" }}>
          Timeline
        </h1>

        {/* view toggle */}
        <div style={{ display:"flex", border:"0.5px solid var(--color-border-secondary)", borderRadius:"var(--border-radius-md)", overflow:"hidden" }}>
          {VIEW_OPTIONS.map(v => (
            <button key={v} onClick={() => setView(v)} style={{
              padding:"6px 14px", fontSize:13, cursor:"pointer",
              background: view === v ? "var(--color-background-secondary)" : "transparent",
              border:"none",
              fontWeight: view === v ? 500 : 400,
              color: view === v ? "var(--color-text-primary)" : "var(--color-text-secondary)",
            }}>
              {v}
            </button>
          ))}
        </div>
      </div>

      {/* summary cards */}
      <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:10, marginBottom:"1.25rem" }}>
        {[
          { label:"Total tasks",  val: summary.total,      color:"var(--color-text-primary)" },
          { label:"In progress",  val: summary.inprogress, color:"var(--color-text-primary)" },
          { label:"Completed",    val: summary.done,       color:"#639922" },
          { label:"Overdue",      val: summary.overdue,    color:"#E24B4A" },
        ].map(({ label, val, color }) => (
          <div key={label} style={{ background:"var(--color-background-secondary)", borderRadius:"var(--border-radius-md)", padding:"12px 14px" }}>
            <div style={{ fontSize:12, color:"var(--color-text-secondary)", marginBottom:4 }}>{label}</div>
            <div style={{ fontSize:22, fontWeight:500, color }}>{val}</div>
          </div>
        ))}
      </div>

      {/* filter chips */}
      <div style={{ display:"flex", gap:8, marginBottom:"1rem", flexWrap:"wrap" }}>
        {[
          { key:"all",        label:"All" },
          { key:"todo",       label:"To do" },
          { key:"inprogress", label:"In progress" },
          { key:"done",       label:"Done" },
          { key:"overdue",    label:"Overdue" },
        ].map(({ key, label }) => (
          <button key={key} onClick={() => setFilter(key)} style={{
            padding:"4px 12px", borderRadius:20, fontSize:12, cursor:"pointer",
            border: filter === key ? "0.5px solid var(--color-border-info)" : "0.5px solid var(--color-border-tertiary)",
            background: filter === key ? "var(--color-background-info)" : "transparent",
            color:  filter === key ? "var(--color-text-info)" : "var(--color-text-secondary)",
          }}>
            {label}
          </button>
        ))}
      </div>

      {/* loading / error */}
      {loading && (
        <div style={{ textAlign:"center", padding:"3rem", color:"var(--color-text-secondary)" }}>
          Loading tasks…
        </div>
      )}
      {error && (
        <div style={{ padding:"1rem", borderRadius:"var(--border-radius-md)", background:"var(--color-background-danger)", color:"var(--color-text-danger)", fontSize:13 }}>
          Failed to load tasks: {error}
        </div>
      )}

      {/* gantt chart */}
      {!loading && !error && (
        <div style={{ border:"0.5px solid var(--color-border-tertiary)", borderRadius:"var(--border-radius-lg)", overflow:"hidden", background:"var(--color-background-primary)" }}>

          {/* header row */}
          <div style={{ display:"grid", gridTemplateColumns:"200px 1fr", borderBottom:"0.5px solid var(--color-border-tertiary)" }}>
            <div style={{ padding:"10px 16px", fontSize:12, fontWeight:500, color:"var(--color-text-secondary)", borderRight:"0.5px solid var(--color-border-tertiary)" }}>
              Task
            </div>
            <div style={{ display:"flex" }}>
              {monthLabels.map((m, i) => (
                <div key={i} style={{
                  flex:1, padding:"10px 0", fontSize:12, fontWeight:500,
                  color:"var(--color-text-secondary)", textAlign:"center",
                  borderRight: i < NUM_MONTHS-1 ? "0.5px solid var(--color-border-tertiary)" : "none",
                }}>
                  {m}
                </div>
              ))}
            </div>
          </div>

          {/* task rows */}
          {filtered.length === 0 ? (
            <div style={{ padding:"2.5rem", textAlign:"center", color:"var(--color-text-secondary)", fontSize:14 }}>
              No tasks found for this filter.
            </div>
          ) : (
            filtered.map(task => (
              <GanttRow key={task.id} task={task} todayLeft={todayLeft} />
            ))
          )}
        </div>
      )}

      {/* legend */}
      {!loading && !error && (
        <div style={{ display:"flex", gap:20, marginTop:"1rem", flexWrap:"wrap", alignItems:"center" }}>
          {Object.entries(STATUS_COLORS).map(([key, { bar }]) => (
            <div key={key} style={{ display:"flex", alignItems:"center", gap:6, fontSize:12, color:"var(--color-text-secondary)" }}>
              <div style={{ width:10, height:10, borderRadius:2, background:bar }} />
              {key === "inprogress" ? "In progress" : key.charAt(0).toUpperCase() + key.slice(1)}
            </div>
          ))}
          <div style={{ marginLeft:"auto", display:"flex", alignItems:"center", gap:6, fontSize:12, color:"var(--color-text-secondary)" }}>
            <div style={{ width:10, height:10, background:"#E24B4A", opacity:.7, borderRadius:1 }} />
            Today
          </div>
        </div>
      )}
    </div>
  );
}
