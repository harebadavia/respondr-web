import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  FaArrowUpRightFromSquare,
  FaUsers,
  FaTriangleExclamation,
  FaBell,
  FaMessage,
} from "react-icons/fa6";
import { apiAuthRequest } from "../services/api";

/* ─── Palette tokens ─────────────────────────────────────────── */
const STATUS_MAP = {
  pending:     { bg: "#FAEEDA", text: "#854F0B", dot: "#EF9F27" },
  verified:    { bg: "#E6F1FB", text: "#185FA5", dot: "#378ADD" },
  in_progress: { bg: "#EEEDFE", text: "#534AB7", dot: "#7F77DD" },
  resolved:    { bg: "#EAF3DE", text: "#3B6D11", dot: "#639922" },
  rejected:    { bg: "#FCEBEB", text: "#A32D2D", dot: "#E24B4A" },
};

const ROLE_COLORS = {
  admin:    { bg: "#EEEDFE", text: "#534AB7" },
  official: { bg: "#E6F1FB", text: "#185FA5" },
  resident: { bg: "#EAF3DE", text: "#3B6D11" },
};

const METRIC_ICONS = [FaUsers, FaTriangleExclamation, FaBell, FaMessage];
const METRIC_ACCENTS = [
  { light: "#E6F1FB", mid: "#378ADD", dark: "#185FA5" },
  { light: "#FAEEDA", mid: "#EF9F27", dark: "#854F0B" },
  { light: "#EAF3DE", mid: "#639922", dark: "#3B6D11" },
  { light: "#EEEDFE", mid: "#7F77DD", dark: "#534AB7" },
];

/* White card surface that pops off the grey page body */
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
  fontSize: 11, fontWeight: 600,
  color: "var(--color-text-tertiary)",
  textAlign: "left", textTransform: "uppercase",
  letterSpacing: "0.06em",
  borderBottom: "0.5px solid var(--color-border-tertiary)",
  whiteSpace: "nowrap",
};

const tdStyle = {
  padding: "11px 12px 11px 0",
  fontSize: 13, color: "var(--color-text-primary)",
  borderBottom: "0.5px solid var(--color-border-tertiary)",
  verticalAlign: "middle",
};

/* ─── Helpers ────────────────────────────────────────────────── */
function StatusBadge({ status }) {
  const val = String(status || "").toLowerCase();
  const s = STATUS_MAP[val] || { bg: "#F1EFE8", text: "#5F5E5A", dot: "#888780" };
  return (
    <span style={{
      display: "inline-flex", alignItems: "center", gap: 5,
      padding: "3px 10px", borderRadius: 999,
      fontSize: 11, fontWeight: 600, letterSpacing: "0.03em",
      background: s.bg, color: s.text,
      textTransform: "capitalize", whiteSpace: "nowrap",
    }}>
      <span style={{ width: 6, height: 6, borderRadius: "50%", background: s.dot, flexShrink: 0 }} />
      {val.replace("_", " ")}
    </span>
  );
}

function RoleBadge({ role }) {
  const val = String(role || "").toLowerCase();
  const s = ROLE_COLORS[val] || { bg: "#F1EFE8", text: "#5F5E5A" };
  return (
    <span style={{
      padding: "2px 9px", borderRadius: 999,
      fontSize: 11, fontWeight: 600,
      background: s.bg, color: s.text,
      textTransform: "capitalize", letterSpacing: "0.02em",
    }}>
      {role}
    </span>
  );
}

function SectionLabel({ children }) {
  return (
    <p style={{
      margin: "0 0 12px", fontSize: 11, fontWeight: 700,
      color: "var(--color-text-tertiary)",
      letterSpacing: "0.08em", textTransform: "uppercase",
    }}>
      {children}
    </p>
  );
}

/* ─── Page header ────────────────────────────────────────────── */
/* ─── Page header ────────────────────────────────────────────── */
function DashboardHeader() {
  // Make the timestamp actually update in real-time
  const [now, setNow] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const date = now.toLocaleDateString("en-US", { weekday: "long", month: "short", day: "numeric" });
  const time = now.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" });

  return (
    <div style={{
      padding: "32px 36px 28px", // Slightly roomier padding
      borderBottom: "1px solid var(--color-border-tertiary)",
      borderRadius: 16,
      display: "flex", alignItems: "center",
      justifyContent: "space-between",
      gap: 24, flexWrap: "wrap",
      background: "var(--color-background-primary)",
      position: "relative",
      overflow: "hidden"
    }}>
      {/* Subtle decorative background gradient to make the header pop */}
      <div style={{
        position: "absolute", top: -80, right: -40,
        width: 300, height: 300, 
        background: "radial-gradient(circle, rgba(127,119,221,0.06) 0%, rgba(255,255,255,0) 60%)",
        borderRadius: "50%", pointerEvents: "none"
      }} />

      <div style={{ display: "flex", alignItems: "center", gap: 18, zIndex: 1 }}>
        {/* Enhanced Shield icon with gradient and shadow */}
        <div style={{
          width: 52, height: 52, borderRadius: 14,
          background: "linear-gradient(135deg, #EEEDFE 0%, #E0DEFC 100%)",
          display: "flex", alignItems: "center", justifyContent: "center",
          flexShrink: 0,
          boxShadow: "0 4px 12px rgba(83, 74, 183, 0.12), inset 0 2px 0 rgba(255, 255, 255, 0.6)",
        }}>
          <svg width="26" height="26" viewBox="0 0 24 24" fill="none">
            <path d="M12 2L4 6v6c0 5.25 3.5 10.15 8 11.35C16.5 22.15 20 17.25 20 12V6L12 2z" fill="#7F77DD" />
            <path d="M9 12l2 2 4-4" stroke="#FFFFFF" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>

        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <h1 style={{
              margin: 0, fontSize: 24, fontWeight: 700,
              color: "var(--color-text-primary)",
              letterSpacing: "-0.03em", lineHeight: 1.2,
            }}>
              Admin Dashboard
            </h1>
            <span style={{
              fontSize: 11, fontWeight: 700, letterSpacing: "0.06em",
              textTransform: "uppercase",
              background: "#EEEDFE", color: "#534AB7",
              padding: "2px 10px", borderRadius: 999,
            }}>
              Admin
            </span>
          </div>
          <p style={{
            margin: "6px 0 0", fontSize: 14,
            color: "var(--color-text-secondary)", lineHeight: 1.5,
          }}>
            System health, access governance, and unresolved operations at a glance.
          </p>
        </div>
      </div>

      {/* Styled Date/Time Pill */}
      <div style={{ zIndex: 1, flexShrink: 0 }}>
        <div style={{
          display: "flex", alignItems: "center", gap: 10,
          padding: "8px 16px", borderRadius: 999,
          background: "var(--color-background-secondary, #F8FAFC)", 
          border: "1px solid var(--color-border-tertiary)",
          color: "var(--color-text-secondary)", fontSize: 13, fontWeight: 500,
          boxShadow: "inset 0 1px 2px rgba(0,0,0,0.02)"
        }}>
          {/* Little glowing "Live" indicator */}
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

/* ─── MetricCard ─────────────────────────────────────────────── */
function MetricCard({ label, value, subtext, shortcutLabel, onShortcut, index }) {
  const accent = METRIC_ACCENTS[index % METRIC_ACCENTS.length];
  const Icon = METRIC_ICONS[index % METRIC_ICONS.length];

  return (
    <div style={{ ...CARD_STYLE, padding: "20px 22px", display: "flex", flexDirection: "column", position: "relative" }}>
      {/* Colored top strip */}
      <div style={{
        position: "absolute", top: 0, left: 0, right: 0, height: 3,
        background: accent.mid, borderRadius: "16px 16px 0 0",
      }} />

      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginTop: 4 }}>
        <div style={{
          width: 36, height: 36, borderRadius: 10,
          background: accent.light,
          display: "flex", alignItems: "center", justifyContent: "center",
        }}>
          <Icon style={{ fontSize: 15, color: accent.dark }} />
        </div>

        {shortcutLabel && (
          <button
            type="button" onClick={onShortcut}
            title={shortcutLabel} aria-label={shortcutLabel}
            style={{
              width: 28, height: 28,
              border: "0.5px solid var(--color-border-secondary)",
              borderRadius: 8, background: "transparent",
              display: "flex", alignItems: "center", justifyContent: "center",
              cursor: "pointer", color: "var(--color-text-tertiary)",
              transition: "all 0.12s",
            }}
            onMouseEnter={e => {
              e.currentTarget.style.background = "var(--color-background-secondary)";
              e.currentTarget.style.color = "var(--color-text-primary)";
            }}
            onMouseLeave={e => {
              e.currentTarget.style.background = "transparent";
              e.currentTarget.style.color = "var(--color-text-tertiary)";
            }}
          >
            <FaArrowUpRightFromSquare style={{ fontSize: 11 }} />
          </button>
        )}
      </div>

      <p style={{ margin: "14px 0 2px", fontSize: 13, fontWeight: 500, color: "var(--color-text-secondary)", letterSpacing: "0.01em" }}>
        {label}
      </p>
      <p style={{ margin: 0, fontSize: 28, fontWeight: 600, color: "var(--color-text-primary)", lineHeight: 1.1, letterSpacing: "-0.02em" }}>
        {value}
      </p>
      {subtext && (
        <p style={{ margin: "6px 0 0", fontSize: 12, color: "var(--color-text-tertiary)", lineHeight: 1.5 }}>
          {subtext}
        </p>
      )}
    </div>
  );
}

/* ─── Page shell (shared wrapper) ───────────────────────────── */
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

/* ─── Main export ────────────────────────────────────────────── */
export default function AdminDashboard() {
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
    return () => { mounted = false; };
  }, []);

  const metrics = useMemo(() => {
    if (!data?.kpis) return [];
    const users = data.kpis.users || {};
    const incidents = data.kpis.incidents || {};
    const alerts = data.kpis.alerts || {};
    const sms = data.kpis.sms_delivery_last_7d || {};
    const openIncidents =
      (incidents.pending || 0) + (incidents.verified || 0) + (incidents.in_progress || 0);
    return [
      {
        label: "Total Users",
        value: (users.total_users ?? 0).toLocaleString(),
        subtext: `Active ${users.active_users ?? 0} · Inactive ${users.inactive_users ?? 0}`,
        shortcutLabel: "Go to Users",
        onShortcut: () => navigate("/admin/users"),
      },
      {
        label: "Open Incidents",
        value: openIncidents.toLocaleString(),
        subtext: `Pending ${incidents.pending ?? 0} · In Progress ${incidents.in_progress ?? 0}`,
        shortcutLabel: "Go to Incident Queue",
        onShortcut: () => navigate("/official/incidents"),
      },
      {
        label: "Alerts Sent (24h)",
        value: (alerts.alerts_24h ?? 0).toLocaleString(),
        subtext: `Last 7 days: ${(alerts.alerts_7d ?? 0).toLocaleString()}`,
        shortcutLabel: "Go to Alerts",
        onShortcut: () => navigate("/official/alerts"),
      },
      {
        label: "SMS Success (7d)",
        value: sms.success_rate_percent == null ? "N/A" : `${sms.success_rate_percent}%`,
        subtext: `${sms.success_like ?? 0} of ${sms.total ?? 0} delivered`,
        shortcutLabel: "Go to SMS Logs",
        onShortcut: () => navigate("/official/sms-logs"),
      },
    ];
  }, [data, navigate]);

  if (loading) {
    return (
      <Shell>
        <div style={{
          display: "flex", alignItems: "center", justifyContent: "center",
          padding: "64px 0", gap: 10,
          color: "var(--color-text-tertiary)", fontSize: 14,
        }}>
          <svg width="18" height="18" viewBox="0 0 24 24" style={{ animation: "spin 0.8s linear infinite" }}>
            <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
            <circle cx="12" cy="12" r="10" fill="none" stroke="currentColor" strokeWidth="2.5" strokeDasharray="40 20" />
          </svg>
          Loading dashboard…
        </div>
      </Shell>
    );
  }

  if (error) {
    return (
      <Shell>
        <div style={{
          background: "#FCEBEB", border: "0.5px solid #F09595",
          borderRadius: 12, padding: "16px 20px",
          color: "#A32D2D", fontSize: 14,
        }}>
          {error}
        </div>
      </Shell>
    );
  }

  const unresolvedIncidents = data?.sections?.unresolved_incidents || [];
  const recentUsers = data?.sections?.recent_users || [];

  return (
    <Shell>
      <div style={{ display: "flex", flexDirection: "column", gap: 28 }}>

        {/* ── KPI metrics ── */}
        <div>
          <SectionLabel>Overview</SectionLabel>
          <div style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
            gap: 16,
          }}>
            {metrics.map((m, i) => (
              <MetricCard key={m.label} {...m} index={i} />
            ))}
          </div>
        </div>

        {/* ── Activity tables ── */}
        <div>
          <SectionLabel>Activity</SectionLabel>
          <div style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))",
            gap: 16,
          }}>

            {/* Unresolved Incidents */}
            <div style={CARD_STYLE}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 18 }}>
                <p style={{ margin: 0, fontSize: 14, fontWeight: 600, color: "var(--color-text-primary)" }}>
                  Unresolved Incidents
                </p>
                <span style={{
                  fontSize: 12, fontWeight: 600,
                  background: "#FAEEDA", color: "#854F0B",
                  padding: "3px 10px", borderRadius: 999,
                }}>
                  {unresolvedIncidents.length} open
                </span>
              </div>

              {unresolvedIncidents.length === 0 ? (
                <p style={{ fontSize: 13, color: "var(--color-text-tertiary)", margin: 0 }}>
                  No unresolved incidents.
                </p>
              ) : (
                <div style={{ overflowX: "auto" }}>
                  <table style={{ width: "100%", borderCollapse: "collapse", tableLayout: "fixed" }}>
                    <colgroup>
                      <col style={{ width: "45%" }} />
                      <col style={{ width: "28%" }} />
                      <col style={{ width: "27%" }} />
                    </colgroup>
                    <thead>
                      <tr>
                        <th style={thStyle}>Title</th>
                        <th style={thStyle}>Status</th>
                        <th style={thStyle}>Reporter</th>
                      </tr>
                    </thead>
                    <tbody>
                      {unresolvedIncidents.map((item, idx) => {
                        const last = idx === unresolvedIncidents.length - 1;
                        const b = last ? "none" : tdStyle.borderBottom;
                        return (
                          <tr key={item.id}>
                            <td style={{ ...tdStyle, fontWeight: 500, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", borderBottom: b }} title={item.title}>
                              {item.title}
                            </td>
                            <td style={{ ...tdStyle, borderBottom: b }}>
                              <StatusBadge status={item.status} />
                            </td>
                            <td style={{ ...tdStyle, color: "var(--color-text-secondary)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", borderBottom: b }}>
                              {item.reported_by_first_name} {item.reported_by_last_name}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* Recent Users */}
            <div style={CARD_STYLE}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 18 }}>
                <p style={{ margin: 0, fontSize: 14, fontWeight: 600, color: "var(--color-text-primary)" }}>
                  Recent Users
                </p>
                <button
                  type="button"
                  onClick={() => navigate("/admin/users")}
                  style={{
                    fontSize: 12, fontWeight: 500,
                    color: "#185FA5", background: "#E6F1FB",
                    border: "none", padding: "4px 12px",
                    borderRadius: 999, cursor: "pointer",
                    display: "flex", alignItems: "center", gap: 5,
                  }}
                >
                  View all <FaArrowUpRightFromSquare style={{ fontSize: 10 }} />
                </button>
              </div>

              {recentUsers.length === 0 ? (
                <p style={{ fontSize: 13, color: "var(--color-text-tertiary)", margin: 0 }}>No users found.</p>
              ) : (
                <div style={{ display: "flex", flexDirection: "column" }}>
                  {recentUsers.map((item, idx) => {
                    const initials = `${(item.first_name || "?")[0]}${(item.last_name || "?")[0]}`.toUpperCase();
                    const isLast = idx === recentUsers.length - 1;
                    return (
                      <div key={item.id} style={{
                        display: "flex", alignItems: "center", gap: 12,
                        padding: "10px 0",
                        borderBottom: isLast ? "none" : "0.5px solid var(--color-border-tertiary)",
                      }}>
                        <div style={{
                          width: 34, height: 34, borderRadius: "50%",
                          background: "#E6F1FB", color: "#185FA5",
                          display: "flex", alignItems: "center", justifyContent: "center",
                          fontSize: 12, fontWeight: 600, flexShrink: 0,
                          letterSpacing: "0.02em",
                        }}>
                          {initials}
                        </div>

                        <div style={{ flex: 1, minWidth: 0 }}>
                          <p style={{ margin: 0, fontSize: 13, fontWeight: 500, color: "var(--color-text-primary)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                            {item.first_name} {item.last_name}
                          </p>
                          <p style={{ margin: 0, fontSize: 12, color: "var(--color-text-tertiary)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                            {item.email}
                          </p>
                        </div>

                        <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 4, flexShrink: 0 }}>
                          <RoleBadge role={item.role} />
                          <span style={{ fontSize: 11, fontWeight: 500, color: item.is_active ? "#3B6D11" : "var(--color-text-tertiary)" }}>
                            {item.is_active ? "● active" : "○ inactive"}
                          </span>
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
