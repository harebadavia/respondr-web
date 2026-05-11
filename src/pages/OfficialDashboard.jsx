import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  FaArrowUpRightFromSquare,
  FaClipboardCheck,
  FaClockRotateLeft,
  FaListCheck,
  FaCircleCheck,
} from "react-icons/fa6";
import PageContainer from "../components/ui/PageContainer";
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
  const date = now.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" });
  const time = now.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" });

  return (
    <div
      style={{
        padding: "26px 32px 24px",
        borderBottom: "0.5px solid var(--color-border-tertiary)",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: 16,
        flexWrap: "wrap",
        background: "var(--color-background-primary)",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
        <div
          style={{
            width: 44,
            height: 44,
            borderRadius: 12,
            background: "#E6F1FB",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
          }}
        >
          <FaClipboardCheck style={{ fontSize: 18, color: "#185FA5" }} />
        </div>

        <div>
          <div style={{ display: "flex", alignItems: "baseline", gap: 9 }}>
            <h1 style={{ margin: 0, fontSize: 20, fontWeight: 600, color: "var(--color-text-primary)", letterSpacing: "-0.025em", lineHeight: 1.25 }}>
              Official Dashboard
            </h1>
            <span
              style={{
                fontSize: 10,
                fontWeight: 700,
                letterSpacing: "0.07em",
                textTransform: "uppercase",
                background: "#E6F1FB",
                color: "#185FA5",
                padding: "2px 8px",
                borderRadius: 999,
                position: "relative",
                top: -1,
              }}
            >
              Official
            </span>
          </div>
          <p style={{ margin: "3px 0 0", fontSize: 13, color: "var(--color-text-secondary)", lineHeight: 1.5 }}>
            Incident triage, response operations, and public communication overview.
          </p>
        </div>
      </div>

      <span style={{ fontSize: 12, color: "var(--color-text-tertiary)", flexShrink: 0, whiteSpace: "nowrap" }}>
        {date} · {time}
      </span>
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

function Shell({ children }) {
  return (
    <PageContainer className="!max-w-none px-0 py-0">
      <DashboardHeader />
      <div style={{ background: "var(--color-background-tertiary)", minHeight: "calc(100vh - 97px)", padding: "28px 32px 48px" }}>
        {children}
      </div>
    </PageContainer>
  );
}

export default function OfficialDashboard() {
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let mounted = true;
    async function load() {
      try {
        setLoading(true);
        setError("");
        const payload = await apiAuthRequest("/dashboard");
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
  }, []);

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

  return (
    <Shell>
      <div style={{ display: "flex", flexDirection: "column", gap: 28 }}>
        <div>
          <SectionLabel>Overview</SectionLabel>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 14 }}>
            {metrics.map((m, i) => <MetricCard key={m.label} {...m} index={i} />)}
          </div>
        </div>

        <div>
          <SectionLabel>Operations</SectionLabel>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: 14 }}>
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
