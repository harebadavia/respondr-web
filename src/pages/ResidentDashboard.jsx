import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  FaArrowUpRightFromSquare,
  FaFileLines,
  FaHourglassHalf,
  FaCircleCheck,
  FaBell,
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

const METRIC_ICONS = [FaFileLines, FaHourglassHalf, FaCircleCheck, FaBell];
const METRIC_ACCENTS = [
  { light: "#E6F1FB", mid: "#378ADD", dark: "#185FA5" },
  { light: "#FAEEDA", mid: "#EF9F27", dark: "#854F0B" },
  { light: "#EAF3DE", mid: "#639922", dark: "#3B6D11" },
  { light: "#EEEDFE", mid: "#7F77DD", dark: "#534AB7" },
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
    <span style={{ display: "inline-flex", alignItems: "center", gap: 5, padding: "3px 10px", borderRadius: 999, fontSize: 11, fontWeight: 600, letterSpacing: "0.03em", background: s.bg, color: s.text, textTransform: "capitalize", whiteSpace: "nowrap" }}>
      <span style={{ width: 6, height: 6, borderRadius: "50%", background: s.dot, flexShrink: 0 }} />
      {val.replace("_", " ")}
    </span>
  );
}

function SectionLabel({ children }) {
  return (
    <p style={{ margin: "0 0 12px", fontSize: 11, fontWeight: 700, color: "var(--color-text-tertiary)", letterSpacing: "0.08em", textTransform: "uppercase" }}>
      {children}
    </p>
  );
}

function DashboardHeader() {
  const now = new Date();
  const date = now.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" });
  const time = now.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" });

  return (
    <div style={{ padding: "26px 32px 24px", borderBottom: "0.5px solid var(--color-border-tertiary)", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16, flexWrap: "wrap", background: "var(--color-background-primary)" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
        <div style={{ width: 44, height: 44, borderRadius: 12, background: "#EAF3DE", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
          <FaFileLines style={{ fontSize: 18, color: "#3B6D11" }} />
        </div>

        <div>
          <div style={{ display: "flex", alignItems: "baseline", gap: 9 }}>
            <h1 style={{ margin: 0, fontSize: 20, fontWeight: 600, color: "var(--color-text-primary)", letterSpacing: "-0.025em", lineHeight: 1.25 }}>Resident Dashboard</h1>
            <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.07em", textTransform: "uppercase", background: "#EAF3DE", color: "#3B6D11", padding: "2px 8px", borderRadius: 999, position: "relative", top: -1 }}>Resident</span>
          </div>
          <p style={{ margin: "3px 0 0", fontSize: 13, color: "var(--color-text-secondary)", lineHeight: 1.5 }}>
            Your reports, local alerts, and announcements in one place.
          </p>
        </div>
      </div>

      <span style={{ fontSize: 12, color: "var(--color-text-tertiary)", flexShrink: 0, whiteSpace: "nowrap" }}>{date} · {time}</span>
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
            style={{ width: 28, height: 28, border: "0.5px solid var(--color-border-secondary)", borderRadius: 8, background: "transparent", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", color: "var(--color-text-tertiary)", transition: "all 0.12s" }}
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

export default function ResidentDashboard() {
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
    const reports = data.kpis.my_reports || {};
    const alertsCount = data.kpis.alerts_count || {};

    return [
      {
        label: "My Reports",
        value: (reports.total ?? 0).toLocaleString(),
        subtext: `Pending ${reports.pending ?? 0} · Verified ${reports.verified ?? 0}`,
        shortcutLabel: "Go to My Reports",
        onShortcut: () => navigate("/resident/incidents"),
      },
      {
        label: "In Progress",
        value: (reports.in_progress ?? 0).toLocaleString(),
        subtext: "Active incidents you reported",
        shortcutLabel: "Go to My Reports",
        onShortcut: () => navigate("/resident/incidents"),
      },
      {
        label: "Resolved",
        value: (reports.resolved ?? 0).toLocaleString(),
        subtext: `Rejected ${reports.rejected ?? 0}`,
        shortcutLabel: "Report New Incident",
        onShortcut: () => navigate("/resident/incidents/new"),
      },
      {
        label: "Latest Alerts",
        value: (alertsCount.latest_feed_count ?? 0).toLocaleString(),
        subtext: "Community safety updates",
        shortcutLabel: "Go to Alerts",
        onShortcut: () => navigate("/resident/alerts"),
      },
    ];
  }, [data, navigate]);

  if (loading) return <Shell><div style={{ color: "var(--color-text-tertiary)" }}>Loading dashboard…</div></Shell>;
  if (error) return <Shell><div style={{ background: "#FCEBEB", border: "0.5px solid #F09595", borderRadius: 12, padding: "16px 20px", color: "#A32D2D", fontSize: 14 }}>{error}</div></Shell>;

  const myRecentReports = data?.sections?.my_recent_reports || [];
  const activeAlerts = data?.sections?.active_alerts || [];

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
          <SectionLabel>Activity</SectionLabel>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: 14 }}>
            <div style={CARD_STYLE}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 18 }}>
                <p style={{ margin: 0, fontSize: 14, fontWeight: 600, color: "var(--color-text-primary)" }}>My Recent Reports</p>
                <span style={{ fontSize: 12, fontWeight: 600, background: "#E6F1FB", color: "#185FA5", padding: "3px 10px", borderRadius: 999 }}>{myRecentReports.length} items</span>
              </div>
              {myRecentReports.length === 0 ? <p style={{ fontSize: 13, color: "var(--color-text-tertiary)", margin: 0 }}>No reports found.</p> : (
                <div style={{ overflowX: "auto" }}>
                  <table style={{ width: "100%", borderCollapse: "collapse", tableLayout: "fixed" }}>
                    <colgroup><col style={{ width: "46%" }} /><col style={{ width: "24%" }} /><col style={{ width: "30%" }} /></colgroup>
                    <thead><tr><th style={thStyle}>Title</th><th style={thStyle}>Status</th><th style={thStyle}>Updated</th></tr></thead>
                    <tbody>
                      {myRecentReports.map((item, idx) => {
                        const b = idx === myRecentReports.length - 1 ? "none" : tdStyle.borderBottom;
                        return (
                          <tr key={item.id}>
                            <td style={{ ...tdStyle, borderBottom: b, fontWeight: 500, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }} title={item.title}>{item.title}</td>
                            <td style={{ ...tdStyle, borderBottom: b }}><StatusBadge status={item.status} /></td>
                            <td style={{ ...tdStyle, borderBottom: b, color: "var(--color-text-secondary)", whiteSpace: "nowrap" }}>{new Date(item.updated_at).toLocaleString()}</td>
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
                <p style={{ margin: 0, fontSize: 14, fontWeight: 600, color: "var(--color-text-primary)" }}>Active Alerts</p>
                <button type="button" onClick={() => navigate("/resident/alerts")} style={{ fontSize: 12, fontWeight: 500, color: "#185FA5", background: "#E6F1FB", border: "none", padding: "4px 12px", borderRadius: 999, cursor: "pointer", display: "flex", alignItems: "center", gap: 5 }}>View all <FaArrowUpRightFromSquare style={{ fontSize: 10 }} /></button>
              </div>
              {activeAlerts.length === 0 ? <p style={{ fontSize: 13, color: "var(--color-text-tertiary)", margin: 0 }}>No active alerts.</p> : (
                <div style={{ display: "flex", flexDirection: "column" }}>
                  {activeAlerts.map((item, idx) => {
                    const isLast = idx === activeAlerts.length - 1;
                    return (
                      <div key={item.id} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, padding: "10px 0", borderBottom: isLast ? "none" : "0.5px solid var(--color-border-tertiary)" }}>
                        <div style={{ minWidth: 0 }}>
                          <p style={{ margin: 0, fontSize: 13, fontWeight: 500, color: "var(--color-text-primary)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{item.title}</p>
                          <p style={{ margin: "2px 0 0", fontSize: 12, color: "var(--color-text-tertiary)", textTransform: "capitalize" }}>{item.type}</p>
                        </div>
                        <span style={{ fontSize: 11, color: "var(--color-text-tertiary)", whiteSpace: "nowrap", flexShrink: 0 }}>{new Date(item.created_at).toLocaleDateString()}</span>
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
