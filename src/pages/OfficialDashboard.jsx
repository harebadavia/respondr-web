import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  FaArrowUpRightFromSquare,
  FaClipboardCheck,
  FaClockRotateLeft,
  FaListCheck,
  FaCircleCheck,
  FaChartLine,
  FaLocationDot,
} from "react-icons/fa6";
import { apiAuthRequest } from "../services/api";

const STATUS_MAP = {
  pending: { bg: "#FAEEDA", text: "#854F0B", dot: "#EF9F27" },
  verified: { bg: "#E6F1FB", text: "#185FA5", dot: "#378ADD" },
  in_progress: { bg: "#EEEDFE", text: "#534AB7", dot: "#7F77DD" },
  resolved: { bg: "#EAF3DE", text: "#3B6D11", dot: "#639922" },
  rejected: { bg: "#FCEBEB", text: "#A32D2D", dot: "#E24B4A" },
};

const METRIC_ICONS = [FaClockRotateLeft, FaClipboardCheck, FaListCheck, FaCircleCheck];
const METRIC_ACCENTS = [
  { light: "#E6F1FB", mid: "#378ADD", dark: "#185FA5" },
  { light: "#FAEEDA", mid: "#EF9F27", dark: "#854F0B" },
  { light: "#EEEDFE", mid: "#7F77DD", dark: "#534AB7" },
  { light: "#EAF3DE", mid: "#639922", dark: "#3B6D11" },
];

const RANGE_OPTIONS = [
  { key: "7d", label: "7 days" },
  { key: "30d", label: "30 days" },
  { key: "90d", label: "90 days" },
];

const CARD_STYLE = {
  background: "#FFFFFF",
  border: "1px solid #DDE4EE",
  borderRadius: 16,
  padding: "22px 24px",
  overflow: "hidden",
  boxShadow: "0 4px 14px rgba(15, 23, 42, 0.06)",
};

const thStyle = {
  padding: "0 12px 10px 0",
  fontSize: 11,
  fontWeight: 600,
  color: "var(--color-text-tertiary)",
  textAlign: "left",
  textTransform: "uppercase",
  letterSpacing: "0.06em",
  borderBottom: "0.5px solid var(--color-border-tertiary)",
  whiteSpace: "nowrap",
};

const tdStyle = {
  padding: "11px 12px 11px 0",
  fontSize: 13,
  color: "var(--color-text-primary)",
  borderBottom: "0.5px solid var(--color-border-tertiary)",
  verticalAlign: "middle",
};

function StatusBadge({ status }) {
  const val = String(status || "").toLowerCase();
  const s = STATUS_MAP[val] || { bg: "#F1EFE8", text: "#5F5E5A", dot: "#888780" };
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 5,
        padding: "3px 10px",
        borderRadius: 999,
        fontSize: 11,
        fontWeight: 600,
        letterSpacing: "0.03em",
        background: s.bg,
        color: s.text,
        textTransform: "capitalize",
        whiteSpace: "nowrap",
      }}
    >
      <span style={{ width: 6, height: 6, borderRadius: "50%", background: s.dot, flexShrink: 0 }} />
      {val.replace("_", " ")}
    </span>
  );
}

function SectionLabel({ children }) {
  return (
    <p
      style={{
        margin: "0 0 12px",
        fontSize: 11,
        fontWeight: 700,
        color: "var(--color-text-tertiary)",
        letterSpacing: "0.08em",
        textTransform: "uppercase",
      }}
    >
      {children}
    </p>
  );
}

function DashboardHeader() {
  const now = new Date();
  const date = now.toLocaleDateString("en-US", { weekday: "long", month: "short", day: "numeric" });
  const time = now.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" });

  return (
    <div style={{
      padding: "32px 36px 28px",
      borderBottom: "1px solid var(--color-border-tertiary)",
      borderRadius: 16,
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      gap: 24,
      flexWrap: "wrap",
      background: "var(--color-background-primary)",
      position: "relative",
      overflow: "hidden",
    }}>
      <div style={{
        position: "absolute",
        top: -80,
        right: -40,
        width: 300,
        height: 300,
        background: "radial-gradient(circle, rgba(55,138,221,0.08) 0%, rgba(255,255,255,0) 60%)",
        borderRadius: "50%",
        pointerEvents: "none",
      }} />

      <div style={{ display: "flex", alignItems: "center", gap: 18, zIndex: 1 }}>
        <div
          style={{
            width: 52,
            height: 52,
            borderRadius: 14,
            background: "linear-gradient(135deg, #E6F1FB 0%, #D9EFFF 100%)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
            boxShadow: "0 4px 12px rgba(24, 95, 165, 0.12), inset 0 2px 0 rgba(255, 255, 255, 0.6)",
          }}
        >
          <FaClipboardCheck style={{ fontSize: 20, color: "#185FA5" }} />
        </div>

        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <h1 style={{
              margin: 0,
              fontSize: 24,
              fontWeight: 700,
              color: "var(--color-text-primary)",
              letterSpacing: "-0.03em",
              lineHeight: 1.2,
            }}>
              Official Dashboard
            </h1>
            <span style={{
              fontSize: 11,
              fontWeight: 700,
              letterSpacing: "0.06em",
              textTransform: "uppercase",
              background: "#E6F1FB",
              color: "#185FA5",
              padding: "2px 10px",
              borderRadius: 999,
            }}>
              Official
            </span>
          </div>
          <p style={{
            margin: "6px 0 0",
            fontSize: 14,
            color: "var(--color-text-secondary)",
            lineHeight: 1.5,
          }}>
            Incident triage, response operations, and public communication overview.
          </p>
        </div>
      </div>

      <div style={{ zIndex: 1, flexShrink: 0 }}>
        <div style={{
          display: "flex", alignItems: "center", gap: 10,
          padding: "8px 16px", borderRadius: 999,
          background: "var(--color-background-secondary, #F8FAFC)",
          border: "1px solid var(--color-border-tertiary)",
          color: "var(--color-text-secondary)", fontSize: 13, fontWeight: 500,
          boxShadow: "inset 0 1px 2px rgba(0,0,0,0.02)"
        }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center" }}>
            <div style={{ width: 6, height: 6, borderRadius: "50%", background: "#10B981", boxShadow: "0 0 8px rgba(16, 185, 129, 0.6)" }} />
          </div>
          <span style={{ color: "var(--color-text-primary)" }}>{date}</span>
          <span style={{ opacity: 0.3 }}>|</span>
          <span style={{ width: "65px", textAlign: "right" }}>{time}</span>
        </div>
      </div>

    </div>
  );
}

function MetricCard({ label, value, subtext, shortcutLabel, onShortcut, index }) {
  const accent = METRIC_ACCENTS[index % METRIC_ACCENTS.length];
  const Icon = METRIC_ICONS[index % METRIC_ICONS.length];

  return (
    <div style={{ ...CARD_STYLE, padding: "20px 22px", display: "flex", flexDirection: "column", position: "relative" }}>
      <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 3, background: accent.mid, borderRadius: "16px 16px 0 0" }} />
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginTop: 4 }}>
        <div style={{ width: 36, height: 36, borderRadius: 10, background: accent.light, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <Icon style={{ fontSize: 15, color: accent.dark }} />
        </div>
        {shortcutLabel && (
          <button
            type="button"
            onClick={onShortcut}
            title={shortcutLabel}
            aria-label={shortcutLabel}
            style={{
              width: 28,
              height: 28,
              border: "0.5px solid var(--color-border-secondary)",
              borderRadius: 8,
              background: "transparent",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              cursor: "pointer",
              color: "var(--color-text-tertiary)",
              transition: "all 0.12s",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = "var(--color-background-secondary)";
              e.currentTarget.style.color = "var(--color-text-primary)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = "transparent";
              e.currentTarget.style.color = "var(--color-text-tertiary)";
            }}
          >
            <FaArrowUpRightFromSquare style={{ fontSize: 11 }} />
          </button>
        )}
      </div>

      <p style={{ margin: "14px 0 2px", fontSize: 13, fontWeight: 500, color: "var(--color-text-secondary)", letterSpacing: "0.01em" }}>{label}</p>
      <p style={{ margin: 0, fontSize: 28, fontWeight: 600, color: "var(--color-text-primary)", lineHeight: 1.1, letterSpacing: "-0.02em" }}>{value}</p>
      {subtext ? <p style={{ margin: "6px 0 0", fontSize: 12, color: "var(--color-text-tertiary)", lineHeight: 1.5 }}>{subtext}</p> : null}
    </div>
  );
}

function EmptyState({ children = "No analytics data for this range." }) {
  return (
    <div style={{ minHeight: 116, display: "flex", alignItems: "center", justifyContent: "center", color: "var(--color-text-tertiary)", fontSize: 13, textAlign: "center", background: "#F8FAFC", border: "1px dashed #D9E2EC", borderRadius: 12, padding: 16 }}>
      {children}
    </div>
  );
}

function formatHours(value) {
  if (value === null || value === undefined || Number.isNaN(Number(value))) return "No data";
  const numeric = Number(value);
  if (numeric < 1) return `${Math.round(numeric * 60)} min`;
  return `${numeric.toFixed(numeric >= 10 ? 0 : 1)} hrs`;
}

function TrendChart({ items }) {
  const data = Array.isArray(items) ? items : [];
  const hasData = data.some((item) => (item.reported || 0) > 0 || (item.resolved || 0) > 0);
  if (!hasData) return <EmptyState>No incident activity recorded in this range.</EmptyState>;

  const width = 520;
  const height = 180;
  const pad = 24;
  const chartWidth = width - pad * 2;
  const chartHeight = height - pad * 2;
  const maxValue = Math.max(1, ...data.map((item) => Math.max(item.reported || 0, item.resolved || 0)));
  const step = data.length > 1 ? chartWidth / (data.length - 1) : chartWidth;
  const barWidth = Math.max(3, Math.min(14, chartWidth / data.length - 4));
  const yFor = (value) => pad + chartHeight - ((value || 0) / maxValue) * chartHeight;
  const resolvedLine = data.map((item, index) => `${pad + index * step},${yFor(item.resolved)}`).join(" ");

  return (
    <div>
      <svg viewBox={`0 0 ${width} ${height}`} role="img" aria-label="Daily reported and resolved incident trend" style={{ width: "100%", height: 190, display: "block" }}>
        {[0, 0.5, 1].map((ratio) => (
          <line key={ratio} x1={pad} x2={width - pad} y1={pad + chartHeight * ratio} y2={pad + chartHeight * ratio} stroke="#E6EDF5" strokeWidth="1" />
        ))}
        {data.map((item, index) => {
          const x = pad + index * step - barWidth / 2;
          const y = yFor(item.reported);
          return (
            <rect key={item.date} x={x} y={y} width={barWidth} height={pad + chartHeight - y} rx="3" fill="#378ADD" opacity="0.72">
              <title>{`${item.date}: ${item.reported || 0} reported, ${item.resolved || 0} resolved`}</title>
            </rect>
          );
        })}
        <polyline points={resolvedLine} fill="none" stroke="#639922" strokeWidth="3" strokeLinejoin="round" strokeLinecap="round" />
        {data.map((item, index) => (
          <circle key={`${item.date}-resolved`} cx={pad + index * step} cy={yFor(item.resolved)} r="3" fill="#639922">
            <title>{`${item.date}: ${item.resolved || 0} resolved`}</title>
          </circle>
        ))}
      </svg>
      <div style={{ display: "flex", gap: 14, flexWrap: "wrap", fontSize: 12, color: "var(--color-text-secondary)" }}>
        <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}><span style={{ width: 10, height: 10, borderRadius: 3, background: "#378ADD" }} />Reported</span>
        <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}><span style={{ width: 18, height: 3, borderRadius: 99, background: "#639922" }} />Resolved</span>
      </div>
    </div>
  );
}

function StatusBreakdown({ items }) {
  const data = Array.isArray(items) ? items : [];
  const total = data.reduce((sum, item) => sum + (item.total || 0), 0);
  if (!total) return <EmptyState>No incident statuses to summarize yet.</EmptyState>;

  return (
    <div>
      <div style={{ display: "flex", height: 16, borderRadius: 999, overflow: "hidden", background: "#F1EFE8", marginBottom: 14 }}>
        {data.map((item) => {
          const colors = STATUS_MAP[item.status] || { dot: "#888780" };
          return <div key={item.status} title={`${item.status}: ${item.total}`} style={{ width: `${Math.max(2, item.percentage || 0)}%`, background: colors.dot }} />;
        })}
      </div>
      <div style={{ display: "grid", gap: 10 }}>
        {data.map((item) => {
          const colors = STATUS_MAP[item.status] || { bg: "#F1EFE8", text: "#5F5E5A", dot: "#888780" };
          return (
            <div key={item.status} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
              <span style={{ display: "inline-flex", alignItems: "center", gap: 8, minWidth: 0, fontSize: 13, color: "var(--color-text-secondary)", textTransform: "capitalize" }}>
                <span style={{ width: 8, height: 8, borderRadius: "50%", background: colors.dot, flexShrink: 0 }} />
                {String(item.status || "").replace("_", " ")}
              </span>
              <span style={{ fontSize: 12, fontWeight: 700, background: colors.bg, color: colors.text, borderRadius: 999, padding: "2px 8px", whiteSpace: "nowrap" }}>{item.total} · {item.percentage ?? 0}%</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function CategoryBars({ items }) {
  const data = Array.isArray(items) ? items : [];
  const maxValue = Math.max(0, ...data.map((item) => item.total || 0));
  if (!maxValue) return <EmptyState>No category pattern is available yet.</EmptyState>;

  return (
    <div style={{ display: "grid", gap: 12 }}>
      {data.map((item) => (
        <div key={item.category}>
          <div style={{ display: "flex", justifyContent: "space-between", gap: 12, marginBottom: 5, fontSize: 12 }}>
            <span style={{ color: "var(--color-text-secondary)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{item.category}</span>
            <span style={{ color: "var(--color-text-tertiary)", fontWeight: 700, whiteSpace: "nowrap" }}>{item.total} · {item.percentage ?? 0}%</span>
          </div>
          <div style={{ height: 9, borderRadius: 999, background: "#EEF3F8", overflow: "hidden" }}>
            <div style={{ width: `${Math.max(4, ((item.total || 0) / maxValue) * 100)}%`, height: "100%", borderRadius: 999, background: "#378ADD" }} />
          </div>
        </div>
      ))}
    </div>
  );
}

function EfficiencyCards({ value }) {
  const data = value || {};
  const cards = [
    { label: "Avg. Verify Time", value: formatHours(data.avg_hours_to_verify), tone: "#E6F1FB", color: "#185FA5" },
    { label: "Avg. Resolve Time", value: formatHours(data.avg_hours_to_resolve), tone: "#EAF3DE", color: "#3B6D11" },
    { label: "Open Backlog", value: (data.unresolved_backlog ?? 0).toLocaleString(), tone: "#FAEEDA", color: "#854F0B" },
  ];

  return (
    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", gap: 10 }}>
      {cards.map((card) => (
        <div key={card.label} style={{ border: "1px solid #DDE4EE", borderRadius: 12, padding: "14px 14px 12px", background: "#FFFFFF" }}>
          <div style={{ width: 30, height: 30, borderRadius: 9, background: card.tone, color: card.color, display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 10 }}>
            <FaChartLine style={{ fontSize: 13 }} />
          </div>
          <p style={{ margin: 0, fontSize: 12, color: "var(--color-text-tertiary)" }}>{card.label}</p>
          <p style={{ margin: "3px 0 0", fontSize: 20, fontWeight: 700, color: "var(--color-text-primary)" }}>{card.value}</p>
        </div>
      ))}
    </div>
  );
}

function HotspotsList({ items, onOpenMap }) {
  const data = Array.isArray(items) ? items : [];
  if (data.length === 0) return <EmptyState>No location hotspots found in this range.</EmptyState>;

  return (
    <div style={{ display: "grid", gap: 10 }}>
      {data.map((item, index) => (
        <div key={`${item.latitude}-${item.longitude}`} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, padding: "10px 0", borderBottom: index === data.length - 1 ? "none" : "0.5px solid var(--color-border-tertiary)" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, minWidth: 0 }}>
            <div style={{ width: 32, height: 32, borderRadius: 10, background: "#EEEDFE", color: "#534AB7", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
              <FaLocationDot style={{ fontSize: 13 }} />
            </div>
            <div style={{ minWidth: 0 }}>
              <p style={{ margin: 0, fontSize: 13, fontWeight: 600, color: "var(--color-text-primary)" }}>{item.total} reports · {item.unresolved || 0} open</p>
              <p style={{ margin: "2px 0 0", fontSize: 12, color: "var(--color-text-tertiary)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{Number(item.latitude).toFixed(3)}, {Number(item.longitude).toFixed(3)}</p>
            </div>
          </div>
          <button type="button" onClick={onOpenMap} style={{ width: 30, height: 30, border: "0.5px solid var(--color-border-secondary)", borderRadius: 8, background: "transparent", color: "var(--color-text-tertiary)", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }} title="Open Map" aria-label="Open Map">
            <FaArrowUpRightFromSquare style={{ fontSize: 11 }} />
          </button>
        </div>
      ))}
    </div>
  );
}

function Shell({ children }) {
  return (
    <section className="space-y-4">
      <div style={{ background: "var(--color-background-tertiary)", borderRadius: 16 }}>
        <DashboardHeader />
        <div style={{ marginTop: 22 }}>
          {children}
        </div>
      </div>
    </section>
  );
}

export default function OfficialDashboard() {
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [analyticsRange, setAnalyticsRange] = useState("30d");

  useEffect(() => {
    let mounted = true;
    async function load() {
      try {
        setLoading(true);
        setError("");
        const payload = await apiAuthRequest(`/dashboard?view=official&range=${analyticsRange}`);
        if (mounted) setData(payload);
      } catch (err) {
        if (mounted) setError(err.message || "Failed to load dashboard");
      } finally {
        if (mounted) setLoading(false);
      }
    }
    load();
    return () => {
      mounted = false;
    };
  }, [analyticsRange]);

  const metrics = useMemo(() => {
    if (!data?.kpis) return [];
    const incidents = data.kpis.incidents || {};
    const activity = data.kpis.activity || {};

    return [
      {
        label: "New Incidents Today",
        value: (activity.new_today ?? 0).toLocaleString(),
        subtext: `Resolved this week: ${(activity.resolved_this_week ?? 0).toLocaleString()}`,
        shortcutLabel: "Open Incident Queue",
        onShortcut: () => navigate("/official/incidents"),
      },
      {
        label: "Pending Verification",
        value: (incidents.pending ?? 0).toLocaleString(),
        subtext: "Fresh reports requiring validation",
        shortcutLabel: "Open Incident Queue",
        onShortcut: () => navigate("/official/incidents"),
      },
      {
        label: "In Progress",
        value: (incidents.in_progress ?? 0).toLocaleString(),
        subtext: "Active response operations",
        shortcutLabel: "Open Incident Queue",
        onShortcut: () => navigate("/official/incidents"),
      },
      {
        label: "Resolved",
        value: (incidents.resolved ?? 0).toLocaleString(),
        subtext: "Completed incidents",
        shortcutLabel: "Go to Alerts",
        onShortcut: () => navigate("/official/alerts"),
      },
    ];
  }, [data, navigate]);

  if (loading) return <Shell><div style={{ color: "var(--color-text-tertiary)" }}>Loading dashboard…</div></Shell>;
  if (error) return <Shell><div style={{ background: "#FCEBEB", border: "0.5px solid #F09595", borderRadius: 12, padding: "16px 20px", color: "#A32D2D", fontSize: 14 }}>{error}</div></Shell>;

  const triageQueue = data?.sections?.triage_queue || [];
  const recentAlerts = data?.sections?.recent_alerts || [];
  const analytics = data?.analytics || {};

  return (
    <Shell>
      <div style={{ display: "flex", flexDirection: "column", gap: 28 }}>
        <div>
          <SectionLabel>Overview</SectionLabel>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 16 }}>
            {metrics.map((m, i) => <MetricCard key={m.label} {...m} index={i} />)}
          </div>
        </div>

        <div>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16, flexWrap: "wrap", marginBottom: 12 }}>
            <SectionLabel>Analytics</SectionLabel>
            <div style={{ display: "inline-flex", padding: 3, border: "1px solid var(--color-border-tertiary)", borderRadius: 10, background: "#FFFFFF", gap: 3 }}>
              {RANGE_OPTIONS.map((option) => {
                const active = analyticsRange === option.key;
                return (
                  <button
                    key={option.key}
                    type="button"
                    onClick={() => setAnalyticsRange(option.key)}
                    style={{
                      border: "none",
                      borderRadius: 8,
                      background: active ? "#185FA5" : "transparent",
                      color: active ? "#FFFFFF" : "var(--color-text-secondary)",
                      fontSize: 12,
                      fontWeight: 700,
                      padding: "6px 10px",
                      cursor: "pointer",
                    }}
                  >
                    {option.label}
                  </button>
                );
              })}
            </div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 16 }}>
            <div style={CARD_STYLE}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, marginBottom: 14 }}>
                <p style={{ margin: 0, fontSize: 14, fontWeight: 600, color: "var(--color-text-primary)" }}>Incident Trend</p>
                <span style={{ fontSize: 12, color: "var(--color-text-tertiary)", fontWeight: 600 }}>{analytics.days || 30} days</span>
              </div>
              <TrendChart items={analytics.incident_trend} />
            </div>

            <div style={CARD_STYLE}>
              <p style={{ margin: "0 0 14px", fontSize: 14, fontWeight: 600, color: "var(--color-text-primary)" }}>Workload Status</p>
              <StatusBreakdown items={analytics.status_breakdown} />
            </div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: 16, marginTop: 16 }}>
            <div style={CARD_STYLE}>
              <p style={{ margin: "0 0 14px", fontSize: 14, fontWeight: 600, color: "var(--color-text-primary)" }}>Top Incident Categories</p>
              <CategoryBars items={analytics.top_categories} />
            </div>

            <div style={CARD_STYLE}>
              <p style={{ margin: "0 0 14px", fontSize: 14, fontWeight: 600, color: "var(--color-text-primary)" }}>Response Efficiency</p>
              <EfficiencyCards value={analytics.response_efficiency} />
            </div>

            <div style={CARD_STYLE}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, marginBottom: 14 }}>
                <p style={{ margin: 0, fontSize: 14, fontWeight: 600, color: "var(--color-text-primary)" }}>Location Hotspots</p>
                <button type="button" onClick={() => navigate("/official/map")} style={{ fontSize: 12, fontWeight: 500, color: "#185FA5", background: "#E6F1FB", border: "none", padding: "4px 12px", borderRadius: 999, cursor: "pointer", display: "flex", alignItems: "center", gap: 5 }}>Open Map <FaArrowUpRightFromSquare style={{ fontSize: 10 }} /></button>
              </div>
              <HotspotsList items={analytics.hotspots} onOpenMap={() => navigate("/official/map")} />
            </div>
          </div>
        </div>

        <div>
          <SectionLabel>Operations</SectionLabel>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: 16 }}>
            <div style={CARD_STYLE}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 18 }}>
                <p style={{ margin: 0, fontSize: 14, fontWeight: 600, color: "var(--color-text-primary)" }}>Incident Triage Queue</p>
                <span style={{ fontSize: 12, fontWeight: 600, background: "#FAEEDA", color: "#854F0B", padding: "3px 10px", borderRadius: 999 }}>{triageQueue.length} items</span>
              </div>
              {triageQueue.length === 0 ? <p style={{ fontSize: 13, color: "var(--color-text-tertiary)", margin: 0 }}>No incident queue items.</p> : (
                <div style={{ overflowX: "auto" }}>
                  <table style={{ width: "100%", borderCollapse: "collapse", tableLayout: "fixed" }}>
                    <colgroup><col style={{ width: "38%" }} /><col style={{ width: "22%" }} /><col style={{ width: "20%" }} /><col style={{ width: "20%" }} /></colgroup>
                    <thead><tr><th style={thStyle}>Title</th><th style={thStyle}>Category</th><th style={thStyle}>Status</th><th style={thStyle}>Reporter</th></tr></thead>
                    <tbody>
                      {triageQueue.map((item, idx) => {
                        const b = idx === triageQueue.length - 1 ? "none" : tdStyle.borderBottom;
                        return (
                          <tr key={item.id}>
                            <td style={{ ...tdStyle, borderBottom: b, fontWeight: 500, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }} title={item.title}>{item.title}</td>
                            <td style={{ ...tdStyle, borderBottom: b, color: "var(--color-text-secondary)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{item.category || "Uncategorized"}</td>
                            <td style={{ ...tdStyle, borderBottom: b }}><StatusBadge status={item.status} /></td>
                            <td style={{ ...tdStyle, borderBottom: b, color: "var(--color-text-secondary)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{item.reported_by_first_name} {item.reported_by_last_name}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            <div style={CARD_STYLE}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 18 }}>
                <p style={{ margin: 0, fontSize: 14, fontWeight: 600, color: "var(--color-text-primary)" }}>Recent Alerts</p>
                <button type="button" onClick={() => navigate("/official/alerts")} style={{ fontSize: 12, fontWeight: 500, color: "#185FA5", background: "#E6F1FB", border: "none", padding: "4px 12px", borderRadius: 999, cursor: "pointer", display: "flex", alignItems: "center", gap: 5 }}>View all <FaArrowUpRightFromSquare style={{ fontSize: 10 }} /></button>
              </div>
              {recentAlerts.length === 0 ? <p style={{ fontSize: 13, color: "var(--color-text-tertiary)", margin: 0 }}>No recent alerts.</p> : (
                <div style={{ display: "flex", flexDirection: "column" }}>
                  {recentAlerts.map((item, idx) => {
                    const isLast = idx === recentAlerts.length - 1;
                    return (
                      <div key={item.id} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, padding: "10px 0", borderBottom: isLast ? "none" : "0.5px solid var(--color-border-tertiary)" }}>
                        <div style={{ minWidth: 0 }}>
                          <p style={{ margin: 0, fontSize: 13, fontWeight: 500, color: "var(--color-text-primary)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{item.title}</p>
                          <p style={{ margin: "2px 0 0", fontSize: 12, color: "var(--color-text-tertiary)", textTransform: "capitalize" }}>{item.type}</p>
                        </div>
                        <div style={{ display: "flex", gap: 6, flexShrink: 0 }}>
                          <span style={{ fontSize: 11, fontWeight: 600, background: item.send_push ? "#EAF3DE" : "#F1EFE8", color: item.send_push ? "#3B6D11" : "#5F5E5A", padding: "2px 8px", borderRadius: 999 }}>Push {item.send_push ? "on" : "off"}</span>
                          <span style={{ fontSize: 11, fontWeight: 600, background: item.send_sms ? "#EEEDFE" : "#F1EFE8", color: item.send_sms ? "#534AB7" : "#5F5E5A", padding: "2px 8px", borderRadius: 999 }}>SMS {item.send_sms ? "on" : "off"}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </Shell>
  );
}
