import { useEffect, useMemo, useState } from "react";
import { getDownloadURL, ref } from "firebase/storage";
import { storage } from "../firebase";
import { useAuth } from "../context/AuthContext";
import { apiAuthRequest } from "../services/api";
import Modal from "../components/ui/Modal";

/* ─── Shared palette (mirrors AdminDashboard) ────────────────── */
const STATUS_MAP = {
  pending:     { bg: "#FAEEDA", text: "#854F0B", dot: "#EF9F27", border: "#FAC775" },
  verified:    { bg: "#E6F1FB", text: "#185FA5", dot: "#378ADD", border: "#B5D4F4" },
  in_progress: { bg: "#EEEDFE", text: "#534AB7", dot: "#7F77DD", border: "#CECBF6" },
  resolved:    { bg: "#EAF3DE", text: "#3B6D11", dot: "#639922", border: "#C0DD97" },
  rejected:    { bg: "#FCEBEB", text: "#A32D2D", dot: "#E24B4A", border: "#F7C1C1" },
};

const STATUS_OPTIONS = ["all", "pending", "verified", "in_progress", "resolved", "rejected"];

const STATUS_ACTIONS = {
  pending: [
    { value: "verified",    label: "Verify",    danger: false },
    { value: "rejected",    label: "Reject",    danger: true  },
  ],
  verified: [
    { value: "in_progress", label: "Mark In Progress", danger: false },
    { value: "resolved",    label: "Resolve",          danger: false },
    { value: "rejected",    label: "Reject",           danger: true  },
  ],
  in_progress: [
    { value: "resolved",    label: "Resolve",   danger: false },
  ],
  resolved: [],
  rejected: [],
};

const SURFACE_CARD_STYLE = {
  background: "#FFFFFF",
  border: "1px solid #DDE4EE",
  boxShadow: "0 4px 14px rgba(15, 23, 42, 0.06)",
};

/* ─── Helpers ────────────────────────────────────────────────── */
function formatCategoryHierarchy(incident) {
  const parent = incident?.parent_category_name || "Uncategorized";
  return incident?.category_name ? `${parent} › ${incident.category_name}` : parent;
}

function formatReporterName(incident) {
  const full = `${incident?.reported_by_first_name || ""} ${incident?.reported_by_last_name || ""}`.trim();
  return full || "Unknown Resident";
}

function formatDate(iso) {
  return new Date(iso).toLocaleString("en-US", {
    month: "short", day: "numeric", year: "numeric",
    hour: "2-digit", minute: "2-digit",
  });
}

/* ─── Sub-components ─────────────────────────────────────────── */
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
      flexShrink: 0,
    }}>
      <span style={{ width: 6, height: 6, borderRadius: "50%", background: s.dot, flexShrink: 0 }} />
      {val.replace("_", " ")}
    </span>
  );
}

function ActionButton({ children, onClick, disabled, danger, small }) {
  const [hover, setHover] = useState(false);
  const base = {
    display: "inline-flex", alignItems: "center", justifyContent: "center",
    padding: small ? "5px 12px" : "7px 16px",
    borderRadius: 8,
    fontSize: small ? 12 : 13,
    fontWeight: 500,
    cursor: disabled ? "not-allowed" : "pointer",
    border: "0.5px solid",
    transition: "all 0.12s",
    opacity: disabled ? 0.55 : 1,
    letterSpacing: "0.01em",
    whiteSpace: "nowrap",
  };
  const style = danger
    ? { ...base, background: hover ? "#FCEBEB" : "transparent", borderColor: "#F09595", color: "#A32D2D" }
    : { ...base, background: hover ? "var(--color-background-secondary)" : "transparent", borderColor: "var(--color-border-secondary)", color: "var(--color-text-primary)" };

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      style={style}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
    >
      {children}
    </button>
  );
}

function PrimaryButton({ children, onClick, disabled, type = "button" }) {
  const [hover, setHover] = useState(false);
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      style={{
        display: "inline-flex", alignItems: "center",
        padding: "7px 18px", borderRadius: 8,
        fontSize: 13, fontWeight: 500,
        cursor: disabled ? "not-allowed" : "pointer",
        border: "none",
        background: hover ? "#0C447C" : "#185FA5",
        color: "#fff",
        transition: "background 0.12s",
        opacity: disabled ? 0.6 : 1,
        letterSpacing: "0.01em",
      }}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
    >
      {children}
    </button>
  );
}

function InlineAlert({ children, tone }) {
  const s = tone === "error"
    ? { bg: "#FCEBEB", border: "#F09595", text: "#A32D2D" }
    : { bg: "#EAF3DE", border: "#C0DD97", text: "#3B6D11" };
  return (
    <div style={{
      background: s.bg, border: `0.5px solid ${s.border}`,
      borderRadius: 8, padding: "10px 14px",
      fontSize: 13, color: s.text, lineHeight: 1.5,
    }}>
      {children}
    </div>
  );
}

/* ─── Page header ────────────────────────────────────────────── */
function PageHeader({ onRefresh, refreshing }) {
  return (
    <div style={{
      padding: "26px 32px 24px",
      borderBottom: "0.5px solid var(--color-border-tertiary)",
      display: "flex", alignItems: "center",
      justifyContent: "space-between",
      gap: 16, flexWrap: "wrap",
      background: "var(--color-background-primary)",
    }}>
      <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
        {/* Clipboard icon badge */}
        <div style={{
          width: 44, height: 44, borderRadius: 12,
          background: "#E6F1FB",
          display: "flex", alignItems: "center", justifyContent: "center",
          flexShrink: 0,
        }}>
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
            <rect x="5" y="3" width="14" height="18" rx="2" fill="#378ADD" opacity="0.25" />
            <rect x="5" y="3" width="14" height="18" rx="2" stroke="#378ADD" strokeWidth="1.5" />
            <path d="M9 3h6a1 1 0 0 1 1 1v1H8V4a1 1 0 0 1 1-1z" fill="#378ADD" />
            <path d="M9 10h6M9 14h4" stroke="#185FA5" strokeWidth="1.4" strokeLinecap="round" />
          </svg>
        </div>

        <div>
          <div style={{ display: "flex", alignItems: "baseline", gap: 9 }}>
            <h1 style={{
              margin: 0, fontSize: 20, fontWeight: 600,
              color: "var(--color-text-primary)",
              letterSpacing: "-0.025em", lineHeight: 1.25,
            }}>
              Incident Queue
            </h1>
            <span style={{
              fontSize: 10, fontWeight: 700, letterSpacing: "0.07em",
              textTransform: "uppercase",
              background: "#E6F1FB", color: "#185FA5",
              padding: "2px 8px", borderRadius: 999,
              position: "relative", top: -1,
            }}>
              Official
            </span>
          </div>
          <p style={{
            margin: "3px 0 0", fontSize: 13,
            color: "var(--color-text-secondary)", lineHeight: 1.5,
          }}>
            Review reports, update statuses, and post barangay responses.
          </p>
        </div>
      </div>

      <ActionButton onClick={onRefresh} disabled={refreshing}>
        {refreshing ? (
          <>
            <svg width="13" height="13" viewBox="0 0 24 24" style={{ marginRight: 6, animation: "spin 0.8s linear infinite" }}>
              <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
              <circle cx="12" cy="12" r="10" fill="none" stroke="currentColor" strokeWidth="2.5" strokeDasharray="40 20" />
            </svg>
            Refreshing…
          </>
        ) : (
          <>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" style={{ marginRight: 6 }}>
              <path d="M4 12a8 8 0 1 1 1.5 4.7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
              <path d="M4 17v-5h5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            Refresh
          </>
        )}
      </ActionButton>
    </div>
  );
}

/* ─── Filter bar ─────────────────────────────────────────────── */
function FilterBar({ statusFilter, setStatusFilter, searchTerm, setSearchTerm }) {
  return (
    <div style={{
      ...SURFACE_CARD_STYLE,
      borderRadius: 16,
      padding: "16px 20px",
      display: "flex",
      gap: 12,
      flexWrap: "wrap",
      alignItems: "flex-end",
    }}>
      {/* Status select */}
      <div style={{ display: "flex", flexDirection: "column", gap: 5, minWidth: 180 }}>
        <label style={{ fontSize: 11, fontWeight: 600, color: "var(--color-text-tertiary)", letterSpacing: "0.06em", textTransform: "uppercase" }}>
          Status
        </label>
        <div style={{ position: "relative" }}>
          <select
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value)}
            style={{
              width: "100%", padding: "7px 32px 7px 11px",
              fontSize: 13, color: "var(--color-text-primary)",
              background: "var(--color-background-secondary)",
              border: "0.5px solid var(--color-border-secondary)",
              borderRadius: 8, appearance: "none", cursor: "pointer",
              outline: "none",
            }}
          >
            {STATUS_OPTIONS.map(s => (
              <option key={s} value={s}>
                {s === "all" ? "All statuses" : s.replace("_", " ")}
              </option>
            ))}
          </select>
          {/* chevron */}
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" style={{ position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)", pointerEvents: "none", color: "var(--color-text-tertiary)" }}>
            <path d="M6 9l6 6 6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>
      </div>

      {/* Search */}
      <div style={{ display: "flex", flexDirection: "column", gap: 5, flex: 1, minWidth: 220 }}>
        <label style={{ fontSize: 11, fontWeight: 600, color: "var(--color-text-tertiary)", letterSpacing: "0.06em", textTransform: "uppercase" }}>
          Search
        </label>
        <div style={{ position: "relative" }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", color: "var(--color-text-tertiary)", pointerEvents: "none" }}>
            <circle cx="11" cy="11" r="7" stroke="currentColor" strokeWidth="2" />
            <path d="M16.5 16.5l4 4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          </svg>
          <input
            type="text"
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            placeholder="Search title, category, description, reporter…"
            style={{
              width: "100%", padding: "7px 11px 7px 32px",
              fontSize: 13, color: "var(--color-text-primary)",
              background: "var(--color-background-secondary)",
              border: "0.5px solid var(--color-border-secondary)",
              borderRadius: 8, outline: "none",
              boxSizing: "border-box",
            }}
          />
        </div>
      </div>
    </div>
  );
}

/* ─── Incident card (list item) ──────────────────────────────── */
function IncidentCard({ incident, onOpen }) {
  const [hover, setHover] = useState(false);
  const status = (incident.status || "").toLowerCase();
  const accent = STATUS_MAP[status] || STATUS_MAP.pending;

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={() => onOpen(incident.id)}
      onKeyDown={e => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); onOpen(incident.id); } }}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{
        ...SURFACE_CARD_STYLE,
        border: hover ? `1px solid ${accent.border}` : SURFACE_CARD_STYLE.border,
        borderRadius: 16,
        padding: "18px 22px",
        cursor: "pointer",
        transition: "border-color 0.15s, background 0.15s",
        position: "relative",
        overflow: "hidden",
      }}
    >
      {/* Left accent bar */}
      <div style={{
        position: "absolute", left: 0, top: 0, bottom: 0, width: 3,
        background: accent.dot,
        borderRadius: "16px 0 0 16px",
        opacity: hover ? 1 : 0.45,
        transition: "opacity 0.15s",
      }} />

      <div style={{ paddingLeft: 8 }}>
        {/* Title row */}
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
          <div style={{ minWidth: 0 }}>
            <h3 style={{
              margin: 0, fontSize: 15, fontWeight: 600,
              color: "var(--color-text-primary)",
              lineHeight: 1.3,
            }}>
              {incident.title}
            </h3>
            <p style={{ margin: "3px 0 0", fontSize: 12, color: "var(--color-text-tertiary)" }}>
              Reported by {formatReporterName(incident)}
            </p>
          </div>
          <StatusBadge status={incident.status} />
        </div>

        {/* Description */}
        <p style={{
          margin: "10px 0 0", fontSize: 13,
          color: "var(--color-text-secondary)",
          lineHeight: 1.55,
          display: "-webkit-box",
          WebkitLineClamp: 2,
          WebkitBoxOrient: "vertical",
          overflow: "hidden",
        }}>
          {incident.description}
        </p>

        {/* Meta row */}
        <div style={{
          marginTop: 12, display: "flex", alignItems: "center",
          justifyContent: "space-between", flexWrap: "wrap", gap: 8,
        }}>
          <span style={{
            fontSize: 12, color: "var(--color-text-tertiary)",
            background: "var(--color-background-secondary)",
            padding: "2px 8px", borderRadius: 6,
          }}>
            {formatCategoryHierarchy(incident)}
          </span>
          <span style={{ fontSize: 12, color: "var(--color-text-tertiary)" }}>
            {formatDate(incident.created_at)}
          </span>
        </div>
      </div>
    </div>
  );
}

/* ─── Detail field row ───────────────────────────────────────── */
function DetailRow({ label, value }) {
  return (
    <div style={{ display: "flex", gap: 8, fontSize: 13, lineHeight: 1.5 }}>
      <span style={{ color: "var(--color-text-tertiary)", flexShrink: 0, minWidth: 100 }}>{label}</span>
      <span style={{ color: "var(--color-text-primary)", fontWeight: 500 }}>{value}</span>
    </div>
  );
}

/* ─── Response card ──────────────────────────────────────────── */
function ResponseCard({ response }) {
  const name = `${response.responded_by_first_name || ""} ${response.responded_by_last_name || ""}`.trim() || "Barangay Official";
  const initials = name.split(" ").map(w => w[0]).join("").slice(0, 2).toUpperCase();

  return (
    <div style={{
      background: "var(--color-background-secondary)",
      border: "0.5px solid var(--color-border-tertiary)",
      borderRadius: 10, padding: "12px 14px",
    }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8, marginBottom: 8 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <div style={{
            width: 28, height: 28, borderRadius: "50%",
            background: "#E6F1FB", color: "#185FA5",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 11, fontWeight: 600, flexShrink: 0,
          }}>
            {initials}
          </div>
          <span style={{ fontSize: 13, fontWeight: 600, color: "var(--color-text-primary)" }}>{name}</span>
        </div>
        <span style={{ fontSize: 11, color: "var(--color-text-tertiary)", whiteSpace: "nowrap" }}>
          {formatDate(response.created_at)}
        </span>
      </div>
      <p style={{ margin: 0, fontSize: 13, color: "var(--color-text-secondary)", lineHeight: 1.6 }}>
        {response.message}
      </p>
    </div>
  );
}

/* ─── Section heading (inside modal) ────────────────────────── */
function ModalSection({ title, children }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
      <p style={{
        margin: 0, fontSize: 11, fontWeight: 700,
        color: "var(--color-text-tertiary)",
        letterSpacing: "0.08em", textTransform: "uppercase",
        paddingBottom: 8,
        borderBottom: "0.5px solid var(--color-border-tertiary)",
      }}>
        {title}
      </p>
      {children}
    </div>
  );
}

/* ─── Main component ─────────────────────────────────────────── */
export default function OfficialIncidents() {
  const { isAuthenticated } = useAuth();

  const [incidents, setIncidents] = useState([]);
  const [loadingIncidents, setLoadingIncidents] = useState(true);
  const [incidentsError, setIncidentsError] = useState("");

  const [statusFilter, setStatusFilter] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");

  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [selectedIncident, setSelectedIncident] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailError, setDetailError] = useState("");
  const [detailImageUrl, setDetailImageUrl] = useState("");

  const [statusActionLoading, setStatusActionLoading] = useState(false);
  const [statusActionMessage, setStatusActionMessage] = useState("");
  const [statusActionError, setStatusActionError] = useState("");

  const [responseText, setResponseText] = useState("");
  const [responseLoading, setResponseLoading] = useState(false);
  const [responseMessage, setResponseMessage] = useState("");
  const [responseError, setResponseError] = useState("");

  const loadIncidents = async () => {
    setLoadingIncidents(true);
    setIncidentsError("");
    try {
      const data = await apiAuthRequest("/incidents");
      setIncidents(Array.isArray(data) ? data : []);
    } catch (err) {
      setIncidentsError(err.message || "Failed to load incident queue");
    } finally {
      setLoadingIncidents(false);
    }
  };

  useEffect(() => {
    if (!isAuthenticated) return;
    loadIncidents();
  }, [isAuthenticated]);

  const visibleIncidents = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();
    return incidents.filter(incident => {
      if (statusFilter !== "all" && incident.status !== statusFilter) return false;
      if (!term) return true;
      return [
        incident.title, incident.description,
        incident.category_name, incident.parent_category_name,
        incident.reported_by_first_name, incident.reported_by_last_name,
      ].filter(Boolean).join(" ").toLowerCase().includes(term);
    });
  }, [incidents, statusFilter, searchTerm]);

  const mergeIncidentIntoQueue = updatedIncident => {
    if (!updatedIncident?.id) return;
    setIncidents(prev =>
      prev.map(item => item.id === updatedIncident.id ? { ...item, ...updatedIncident } : item)
    );
  };

  const openDetailModal = async incidentId => {
    setDetailModalOpen(true);
    setDetailLoading(true);
    setDetailError("");
    setDetailImageUrl("");
    setSelectedIncident(null);
    setStatusActionMessage("");
    setStatusActionError("");
    setResponseText("");
    setResponseMessage("");
    setResponseError("");

    try {
      const data = await apiAuthRequest(`/incidents/${incidentId}`);
      setSelectedIncident(data);
      const first = Array.isArray(data.attachments) ? data.attachments[0] : null;
      if (first?.storage_path) {
        const url = await getDownloadURL(ref(storage, first.storage_path));
        setDetailImageUrl(url);
      }
    } catch (err) {
      setDetailError(err.message || "Failed to load incident details");
    } finally {
      setDetailLoading(false);
    }
  };

  const refreshIncidentDetail = async incidentId => {
    const data = await apiAuthRequest(`/incidents/${incidentId}`);
    setSelectedIncident(data);
    mergeIncidentIntoQueue(data);
    const first = Array.isArray(data.attachments) ? data.attachments[0] : null;
    if (first?.storage_path) {
      const url = await getDownloadURL(ref(storage, first.storage_path));
      setDetailImageUrl(url);
    } else {
      setDetailImageUrl("");
    }
  };

  const handleStatusChange = async nextStatus => {
    if (!selectedIncident) return;
    setStatusActionLoading(true);
    setStatusActionError("");
    setStatusActionMessage("");
    try {
      const updated = await apiAuthRequest(`/incidents/${selectedIncident.id}/status`, {
        method: "PUT",
        body: JSON.stringify({ status: nextStatus }),
      });
      mergeIncidentIntoQueue(updated);
      await refreshIncidentDetail(selectedIncident.id);
      setStatusActionMessage(`Status updated to "${nextStatus.replace("_", " ")}".`);
    } catch (err) {
      setStatusActionError(err.message || "Failed to update status");
      try { await refreshIncidentDetail(selectedIncident.id); } catch { /* keep error */ }
    } finally {
      setStatusActionLoading(false);
    }
  };

  const handleSubmitResponse = async event => {
    event.preventDefault();
    if (!selectedIncident) return;
    const message = responseText.trim();
    if (!message) { setResponseError("Response message is required."); return; }
    if (message.length > 2000) { setResponseError("Response must be 2000 characters or fewer."); return; }

    setResponseLoading(true);
    setResponseError("");
    setResponseMessage("");

    try {
      const created = await apiAuthRequest(`/incidents/${selectedIncident.id}/response`, {
        method: "POST",
        body: JSON.stringify({ message }),
      });
      setSelectedIncident(prev => {
        if (!prev) return prev;
        const responses = Array.isArray(prev.responses) ? prev.responses : [];
        return { ...prev, responses: [...responses, created] };
      });
      setResponseText("");
      setResponseMessage("Response added successfully.");
    } catch (err) {
      setResponseError(err.message || "Failed to submit response");
    } finally {
      setResponseLoading(false);
    }
  };

  const availableActions = STATUS_ACTIONS[selectedIncident?.status] || [];

  /* ── Empty / loading states ── */
  const bodyContent = () => {
    if (loadingIncidents) {
      return (
        <div style={{
          ...SURFACE_CARD_STYLE,
          borderRadius: 16, padding: "40px 24px",
          display: "flex", alignItems: "center", justifyContent: "center",
          gap: 10, color: "var(--color-text-tertiary)", fontSize: 14,
        }}>
          <svg width="16" height="16" viewBox="0 0 24 24" style={{ animation: "spin 0.8s linear infinite" }}>
            <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
            <circle cx="12" cy="12" r="10" fill="none" stroke="currentColor" strokeWidth="2.5" strokeDasharray="40 20" />
          </svg>
          Loading incident queue…
        </div>
      );
    }
    if (visibleIncidents.length === 0) {
      return (
        <div style={{
          ...SURFACE_CARD_STYLE,
          borderRadius: 16, padding: "40px 24px",
          textAlign: "center", color: "var(--color-text-tertiary)", fontSize: 14,
        }}>
          No incidents found for the current filters.
        </div>
      );
    }
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {visibleIncidents.map(incident => (
          <IncidentCard key={incident.id} incident={incident} onOpen={openDetailModal} />
        ))}
      </div>
    );
  };

  return (
    <>
      {/* ── Page wrapper (mirrors AdminDashboard Shell) ── */}
      <div style={{ display: "flex", flexDirection: "column", minHeight: "100vh" }}>
        <PageHeader onRefresh={loadIncidents} refreshing={loadingIncidents} />

        <div style={{
          background: "var(--color-background-tertiary)",
          flex: 1,
          padding: "28px 32px 48px",
          display: "flex", flexDirection: "column", gap: 16,
        }}>
          <FilterBar
            statusFilter={statusFilter}
            setStatusFilter={setStatusFilter}
            searchTerm={searchTerm}
            setSearchTerm={setSearchTerm}
          />

          {incidentsError && <InlineAlert tone="error">{incidentsError}</InlineAlert>}

          {bodyContent()}
        </div>
      </div>

      {/* ── Detail modal ── */}
      <Modal
        open={detailModalOpen}
        onClose={() => setDetailModalOpen(false)}
        title="Incident Details"
        className="max-w-3xl"
      >
        {detailLoading && (
          <div style={{ display: "flex", alignItems: "center", gap: 10, color: "var(--color-text-tertiary)", fontSize: 14, padding: "8px 0" }}>
            <svg width="16" height="16" viewBox="0 0 24 24" style={{ animation: "spin 0.8s linear infinite" }}>
              <circle cx="12" cy="12" r="10" fill="none" stroke="currentColor" strokeWidth="2.5" strokeDasharray="40 20" />
            </svg>
            Loading details…
          </div>
        )}

        {!detailLoading && detailError && <InlineAlert tone="error">{detailError}</InlineAlert>}

        {!detailLoading && !detailError && selectedIncident && (
          <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>

            {/* Title + badge */}
            <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
              <h3 style={{ margin: 0, fontSize: 18, fontWeight: 600, color: "var(--color-text-primary)", lineHeight: 1.3 }}>
                {selectedIncident.title}
              </h3>
              <StatusBadge status={selectedIncident.status} />
            </div>

            {/* Description */}
            <p style={{ margin: 0, fontSize: 14, color: "var(--color-text-secondary)", lineHeight: 1.65 }}>
              {selectedIncident.description}
            </p>

            {/* Meta */}
            <ModalSection title="Details">
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                <DetailRow label="Reported by"  value={formatReporterName(selectedIncident)} />
                <DetailRow label="Category"     value={formatCategoryHierarchy(selectedIncident)} />
                <DetailRow label="Coordinates"  value={`${selectedIncident.latitude}, ${selectedIncident.longitude}`} />
                <DetailRow label="Submitted"    value={formatDate(selectedIncident.created_at)} />
                <DetailRow label="ID"           value={selectedIncident.id} />
              </div>
            </ModalSection>

            {/* Attachment */}
            <ModalSection title="Attachment">
              {detailImageUrl ? (
                <img
                  src={detailImageUrl}
                  alt="Incident attachment"
                  style={{ width: "100%", maxWidth: 520, borderRadius: 10, border: "0.5px solid var(--color-border-tertiary)", display: "block" }}
                />
              ) : (
                <p style={{ margin: 0, fontSize: 13, color: "var(--color-text-tertiary)" }}>No attachment provided.</p>
              )}
            </ModalSection>

            {/* Status actions */}
            <ModalSection title="Status Actions">
              {statusActionError && <InlineAlert tone="error">{statusActionError}</InlineAlert>}
              {statusActionMessage && <InlineAlert tone="success">{statusActionMessage}</InlineAlert>}
              {availableActions.length === 0 ? (
                <p style={{ margin: 0, fontSize: 13, color: "var(--color-text-tertiary)" }}>
                  No further status transitions available.
                </p>
              ) : (
                <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                  {availableActions.map(action => (
                    <ActionButton
                      key={action.value}
                      danger={action.danger}
                      disabled={statusActionLoading}
                      onClick={() => handleStatusChange(action.value)}
                    >
                      {statusActionLoading ? "Updating…" : action.label}
                    </ActionButton>
                  ))}
                </div>
              )}
            </ModalSection>

            {/* Response timeline */}
            <ModalSection title="Barangay Response Timeline">
              {Array.isArray(selectedIncident.responses) && selectedIncident.responses.length > 0 ? (
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  {selectedIncident.responses.map(r => <ResponseCard key={r.id} response={r} />)}
                </div>
              ) : (
                <p style={{ margin: 0, fontSize: 13, color: "var(--color-text-tertiary)" }}>No responses yet.</p>
              )}

              {/* Add response form */}
              <div style={{
                marginTop: 4, paddingTop: 16,
                borderTop: "0.5px solid var(--color-border-tertiary)",
                display: "flex", flexDirection: "column", gap: 10,
              }}>
                {responseError && <InlineAlert tone="error">{responseError}</InlineAlert>}
                {responseMessage && <InlineAlert tone="success">{responseMessage}</InlineAlert>}

                <label style={{ fontSize: 11, fontWeight: 700, color: "var(--color-text-tertiary)", letterSpacing: "0.07em", textTransform: "uppercase" }}>
                  Add Response
                </label>
                <textarea
                  rows={4}
                  value={responseText}
                  onChange={e => setResponseText(e.target.value)}
                  maxLength={2000}
                  placeholder="Write the official action taken or advisory for this incident…"
                  style={{
                    width: "100%", padding: "10px 12px",
                    fontSize: 13, color: "var(--color-text-primary)",
                    background: "var(--color-background-secondary)",
                    border: "0.5px solid var(--color-border-secondary)",
                    borderRadius: 8, outline: "none", resize: "vertical",
                    lineHeight: 1.6, boxSizing: "border-box",
                    fontFamily: "inherit",
                  }}
                />

                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
                  <span style={{ fontSize: 11, color: responseText.length > 1900 ? "#854F0B" : "var(--color-text-tertiary)" }}>
                    {responseText.length}/2000
                  </span>
                  <PrimaryButton
                    type="submit"
                    disabled={responseLoading}
                    onClick={handleSubmitResponse}
                  >
                    {responseLoading ? "Submitting…" : "Submit Response"}
                  </PrimaryButton>
                </div>
              </div>
            </ModalSection>

          </div>
        )}
      </Modal>
    </>
  );
}
