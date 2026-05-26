import { useState, useEffect, useRef, useMemo } from "react";
import {
  Chart,
  LineElement, BarElement, ArcElement,
  PointElement, CategoryScale, LinearScale,
  Tooltip, Legend, Filler,
} from "chart.js";
import { Line, Bar, Doughnut } from "react-chartjs-2";
import api from "../api/client";

Chart.register(LineElement, BarElement, ArcElement, PointElement, CategoryScale, LinearScale, Tooltip, Legend, Filler);

// ─── constants ────────────────────────────────────────────────────────────────
const RANGE_OPTIONS = [
  { key: "7d",  label: "7d",       days: 7  },
  { key: "30d", label: "30d",      days: 30 },
  { key: "90d", label: "90d",      days: 90 },
  { key: "all", label: "All time", days: 365 },
];

const STATUS_COLORS = {
  todo:       "#378ADD",
  inprogress: "#1D9E75",
  done:       "#639922",
  overdue:    "#E24B4A",
};

const CHART_DEFAULTS = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: { legend: { display: false } },
};

// ─── helpers ──────────────────────────────────────────────────────────────────
function withinRange(dateStr, days) {
  if (!dateStr) return false;
  const cutoff = Date.now() - days * 86400 * 1000;
  return new Date(dateStr).getTime() >= cutoff;
}

function getWeekLabel(date) {
  const d = new Date(date);
  return `${d.getMonth() + 1}/${d.getDate()}`;
}

function buildWeeklyBuckets(tasks, days) {
  const numWeeks = Math.min(8, Math.ceil(days / 7));
  const now = Date.now();
  const buckets = Array.from({ length: numWeeks }, (_, i) => {
    const end   = now - i * 7 * 86400 * 1000;
    const start = end - 7 * 86400 * 1000;
    return { label: getWeekLabel(end), start, end, created: 0, completed: 0 };
  }).reverse();

  tasks.forEach(t => {
    const created = new Date(t.created_at).getTime();
    buckets.forEach(b => {
      if (created >= b.start && created < b.end) b.created++;
    });
    if (t.status === "done" && t.updated_at) {
      const updated = new Date(t.updated_at).getTime();
      buckets.forEach(b => {
        if (updated >= b.start && updated < b.end) b.completed++;
      });
    }
  });

  return buckets;
}

function normStatus(s) {
  if (!s) return "todo";
  const lower = s.toLowerCase().replace(/[_\s]/g, "");
  if (lower === "done" || lower === "complete" || lower === "completed") return "done";
  if (lower === "inprogress") return "inprogress";
  return "todo";
}

// ─── sub-components ──────────────────────────────────────────────────────────

function MetricCard({ label, value, delta, deltaPositive }) {
  return (
    <div style={{ background: "var(--color-background-secondary)", borderRadius: "var(--border-radius-md)", padding: "14px" }}>
      <div style={{ fontSize: 12, color: "var(--color-text-secondary)", marginBottom: 4 }}>{label}</div>
      <div style={{ fontSize: 22, fontWeight: 500, color: "var(--color-text-primary)" }}>{value}</div>
      {delta && (
        <div style={{ fontSize: 11, marginTop: 4, color: deltaPositive ? "#639922" : "#E24B4A" }}>{delta}</div>
      )}
    </div>
  );
}

function ChartCard({ title, children, fullWidth }) {
  return (
    <div style={{
      background: "var(--color-background-primary)",
      border: "0.5px solid var(--color-border-tertiary)",
      borderRadius: "var(--border-radius-lg)",
      padding: 16,
      ...(fullWidth ? { marginBottom: 12 } : {}),
    }}>
      <div style={{ fontSize: 13, fontWeight: 500, color: "var(--color-text-primary)", marginBottom: 12 }}>{title}</div>
      {children}
    </div>
  );
}

function CustomLegend({ items }) {
  return (
    <div style={{ display: "flex", gap: 14, flexWrap: "wrap", marginBottom: 10 }}>
      {items.map(({ color, label }) => (
        <span key={label} style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 11, color: "var(--color-text-secondary)" }}>
          <span style={{ width: 9, height: 9, borderRadius: 2, background: color, flexShrink: 0 }} />
          {label}
        </span>
      ))}
    </div>
  );
}

function AssigneeWorkload({ tasks }) {
  const counts = useMemo(() => {
    const map = {};
    tasks.forEach(t => {
      const name = t.assignee || t.assigned_to || "Unassigned";
      map[name] = (map[name] || 0) + 1;
    });
    return Object.entries(map).sort((a, b) => b[1] - a[1]).slice(0, 6);
  }, [tasks]);

  const max = counts[0]?.[1] || 1;
  const AVATARS = ["#E6F1FB:#0C447C", "#E1F5EE:#085041", "#FAEEDA:#633806", "#FBEAF0:#72243E", "#EEEDFE:#3C3489", "#F1EFE8:#444441"];

  return (
    <div>
      {counts.map(([name, count], i) => {
        const [bg, tc] = AVATARS[i % AVATARS.length].split(":");
        const initials = name.split(" ").map(w => w[0]).join("").slice(0, 2).toUpperCase();
        return (
          <div key={name} style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
            <div style={{ width: 28, height: 28, borderRadius: "50%", background: bg, color: tc, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 500, flexShrink: 0 }}>
              {initials}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 12, color: "var(--color-text-primary)", marginBottom: 4 }}>{name}</div>
              <div style={{ height: 6, background: "var(--color-border-tertiary)", borderRadius: 3, overflow: "hidden" }}>
                <div style={{ height: "100%", width: `${Math.round(count / max * 100)}%`, background: tc, borderRadius: 3 }} />
              </div>
            </div>
            <span style={{ fontSize: 12, color: "var(--color-text-secondary)", minWidth: 20, textAlign: "right" }}>{count}</span>
          </div>
        );
      })}
      {counts.length === 0 && (
        <div style={{ fontSize: 13, color: "var(--color-text-tertiary)", padding: "1rem 0" }}>No assignee data yet.</div>
      )}
    </div>
  );
}

// ─── main page ────────────────────────────────────────────────────────────────
export default function Reports() {
  const [tasks,   setTasks]   = useState([]);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState(null);
  const [range,   setRange]   = useState("30d");

  useEffect(() => {
    const projectId = localStorage.getItem("activeProject");
    const url = projectId ? `/tasks?project_id=${projectId}` : "/tasks";
    api.get(url)
      .then(res => setTasks(Array.isArray(res.data) ? res.data : res.data.tasks || []))
      .catch(err => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  const days = RANGE_OPTIONS.find(r => r.key === range)?.days || 30;

  const filtered = useMemo(() => tasks.filter(t => withinRange(t.created_at, days)), [tasks, days]);

  // ── metrics ──
  const metrics = useMemo(() => {
    const total     = filtered.length;
    const done      = filtered.filter(t => normStatus(t.status) === "done").length;
    const rate      = total ? Math.round(done / total * 100) : 0;

    const durations = filtered
      .filter(t => normStatus(t.status) === "done" && t.created_at && t.updated_at)
      .map(t => (new Date(t.updated_at) - new Date(t.created_at)) / (1000 * 3600 * 24));
    const avgDays = durations.length
      ? (durations.reduce((a, b) => a + b, 0) / durations.length).toFixed(1)
      : "—";

    return { total, done, rate, avgDays };
  }, [filtered]);

  // ── velocity chart ──
  const velocityData = useMemo(() => {
    const buckets = buildWeeklyBuckets(filtered, days);
    return {
      labels: buckets.map(b => b.label),
      datasets: [
        {
          label: "Created",
          data: buckets.map(b => b.created),
          borderColor: "#378ADD",
          backgroundColor: "transparent",
          borderWidth: 2,
          pointRadius: 3,
          pointBackgroundColor: "#378ADD",
          tension: 0.3,
          borderDash: [],
        },
        {
          label: "Completed",
          data: buckets.map(b => b.completed),
          borderColor: "#1D9E75",
          backgroundColor: "transparent",
          borderWidth: 2,
          pointRadius: 3,
          pointBackgroundColor: "#1D9E75",
          tension: 0.3,
          borderDash: [4, 3],
        },
      ],
    };
  }, [filtered, days]);

  // ── status donut ──
  const donutData = useMemo(() => {
    const counts = { todo: 0, inprogress: 0, done: 0, overdue: 0 };
    filtered.forEach(t => {
      const s = normStatus(t.status);
      const isOverdue = s !== "done" && t.due_date && new Date(t.due_date) < new Date();
      counts[isOverdue ? "overdue" : s]++;
    });
    return {
      labels: ["To do", "In progress", "Done", "Overdue"],
      datasets: [{
        data: [counts.todo, counts.inprogress, counts.done, counts.overdue],
        backgroundColor: [STATUS_COLORS.todo, STATUS_COLORS.inprogress, STATUS_COLORS.done, STATUS_COLORS.overdue],
        borderWidth: 0,
        hoverOffset: 4,
      }],
    };
  }, [filtered]);

  // ── weekly bar ──
  const weeklyBarData = useMemo(() => {
    const buckets = buildWeeklyBuckets(filtered, days);
    return {
      labels: buckets.map(b => b.label),
      datasets: [{
        label: "Completed",
        data: buckets.map(b => b.completed),
        backgroundColor: "#1D9E75",
        borderRadius: 3,
        borderSkipped: false,
      }],
    };
  }, [filtered, days]);

  const tickStyle = { font: { size: 11 }, color: "#888780" };
  const gridStyle = { color: "rgba(128,128,128,.1)" };

  // ── render ──
  return (
    <div style={{ padding: "24px 28px", fontFamily: "inherit", maxWidth: "100%" }}>

      {/* header */}
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: "1.25rem", flexWrap: "wrap" }}>
        <h1 style={{ fontSize: 20, fontWeight: 500, flex: 1, color: "var(--color-text-primary)" }}>
          Reports
        </h1>
        <div style={{ display: "flex", gap: 6 }}>
          {RANGE_OPTIONS.map(r => (
            <button key={r.key} onClick={() => setRange(r.key)} style={{
              padding: "5px 12px", fontSize: 12, cursor: "pointer",
              border: "0.5px solid var(--color-border-secondary)",
              borderRadius: "var(--border-radius-md)",
              background: range === r.key ? "var(--color-background-secondary)" : "transparent",
              fontWeight: range === r.key ? 500 : 400,
              color: range === r.key ? "var(--color-text-primary)" : "var(--color-text-secondary)",
            }}>
              {r.label}
            </button>
          ))}
        </div>
      </div>

      {loading && (
        <div style={{ textAlign: "center", padding: "3rem", color: "var(--color-text-secondary)" }}>Loading…</div>
      )}
      {error && (
        <div style={{ padding: "1rem", borderRadius: "var(--border-radius-md)", background: "var(--color-background-danger)", color: "var(--color-text-danger)", fontSize: 13 }}>
          Failed to load tasks: {error}
        </div>
      )}

      {!loading && !error && (
        <>
          {/* metric cards */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 10, marginBottom: "1.25rem" }}>
            <MetricCard label="Tasks created"        value={metrics.total}        />
            <MetricCard label="Tasks completed"      value={metrics.done}         />
            <MetricCard label="Completion rate"      value={`${metrics.rate}%`}   />
            <MetricCard label="Avg time to complete" value={metrics.avgDays === "—" ? "—" : `${metrics.avgDays}d`} />
          </div>

          {/* velocity line chart */}
          <ChartCard title="Task velocity — created vs completed" fullWidth>
            <CustomLegend items={[
              { color: STATUS_COLORS.todo,       label: "Created" },
              { color: STATUS_COLORS.inprogress, label: "Completed (dashed)" },
            ]} />
            <div style={{ position: "relative", height: 200 }}>
              <Line
                data={velocityData}
                options={{
                  ...CHART_DEFAULTS,
                  scales: {
                    x: { grid: gridStyle, ticks: { ...tickStyle, autoSkip: false, maxRotation: 0 } },
                    y: { grid: gridStyle, ticks: { ...tickStyle, stepSize: 2 }, beginAtZero: true },
                  },
                }}
              />
            </div>
          </ChartCard>

          {/* bottom two-col row */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 12 }}>

            {/* donut */}
            <ChartCard title="Status breakdown">
              <CustomLegend items={[
                { color: STATUS_COLORS.todo,       label: `To do ${donutData.datasets[0].data[0]}` },
                { color: STATUS_COLORS.inprogress, label: `In progress ${donutData.datasets[0].data[1]}` },
                { color: STATUS_COLORS.done,       label: `Done ${donutData.datasets[0].data[2]}` },
                { color: STATUS_COLORS.overdue,    label: `Overdue ${donutData.datasets[0].data[3]}` },
              ]} />
              <div style={{ position: "relative", height: 180 }}>
                <Doughnut
                  data={donutData}
                  options={{ ...CHART_DEFAULTS, cutout: "68%" }}
                />
              </div>
            </ChartCard>

            {/* assignee workload */}
            <ChartCard title="Workload by assignee">
              <AssigneeWorkload tasks={filtered} />
            </ChartCard>
          </div>

          {/* weekly bar */}
          <ChartCard title="Tasks completed per week" fullWidth>
            <div style={{ position: "relative", height: 160 }}>
              <Bar
                data={weeklyBarData}
                options={{
                  ...CHART_DEFAULTS,
                  scales: {
                    x: { grid: { display: false }, ticks: { ...tickStyle, autoSkip: false, maxRotation: 0 } },
                    y: { grid: gridStyle, ticks: { ...tickStyle, stepSize: 2 }, beginAtZero: true },
                  },
                }}
              />
            </div>
          </ChartCard>
        </>
      )}
    </div>
  );
}
