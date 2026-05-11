import { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { apiAuthRequest } from "../services/api";
import Modal from "../components/ui/Modal";

const INITIAL_FORM = {
  name: "",
  description: "",
  latitude: "",
  longitude: "",
  is_active: "true",
};

const SURFACE_CARD_STYLE = {
  background: "#FFFFFF",
  border: "1px solid #DDE4EE",
  borderRadius: 16,
  boxShadow: "0 4px 14px rgba(15, 23, 42, 0.06)",
};

function toPayload(form) {
  return {
    name: form.name.trim(),
    description: form.description.trim() || null,
    latitude: Number(form.latitude),
    longitude: Number(form.longitude),
    is_active: form.is_active === "true",
  };
}

function ActionButton({ children, onClick, disabled, danger }) {
  const [hover, setHover] = useState(false);
  const style = danger
    ? {
        border: "0.5px solid #F09595",
        color: "#A32D2D",
        background: hover ? "#FCEBEB" : "transparent",
      }
    : {
        border: "0.5px solid var(--color-border-secondary)",
        color: "var(--color-text-primary)",
        background: hover ? "var(--color-background-secondary)" : "transparent",
      };

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      style={{
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "6px 14px",
        borderRadius: 8,
        fontSize: 12,
        fontWeight: 500,
        cursor: disabled ? "not-allowed" : "pointer",
        transition: "all 0.12s",
        opacity: disabled ? 0.55 : 1,
        whiteSpace: "nowrap",
        ...style,
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
    <div
      style={{
        background: s.bg,
        border: `0.5px solid ${s.border}`,
        borderRadius: 12,
        padding: "12px 14px",
        fontSize: 13,
        color: s.text,
      }}
    >
      {children}
    </div>
  );
}

function PageHeader({ onCreate, refreshing, onRefresh }) {
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
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
            <path d="M12 3l8 4v5c0 5.4-3.8 8.9-8 10-4.2-1.1-8-4.6-8-10V7l8-4z" fill="#378ADD" opacity="0.2" />
            <path d="M12 3l8 4v5c0 5.4-3.8 8.9-8 10-4.2-1.1-8-4.6-8-10V7l8-4z" stroke="#378ADD" strokeWidth="1.5" />
            <path d="M8.5 12.5h7M8.5 15h4.5" stroke="#185FA5" strokeWidth="1.4" strokeLinecap="round" />
          </svg>
        </div>

        <div>
          <div style={{ display: "flex", alignItems: "baseline", gap: 9 }}>
            <h1
              style={{
                margin: 0,
                fontSize: 20,
                fontWeight: 600,
                color: "var(--color-text-primary)",
                letterSpacing: "-0.025em",
              }}
            >
              Locations
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
            Manage barangay landmarks and evacuation points.
          </p>
        </div>
      </div>

      <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
        <ActionButton onClick={onRefresh} disabled={refreshing}>
          {refreshing ? "Refreshing…" : "Refresh"}
        </ActionButton>
        <button
          type="button"
          onClick={onCreate}
          style={{
            border: "none",
            borderRadius: 8,
            background: "#185FA5",
            color: "#fff",
            fontSize: 13,
            fontWeight: 500,
            padding: "8px 14px",
            cursor: "pointer",
          }}
        >
          Add Location
        </button>
      </div>
    </div>
  );
}

export default function OfficialLocations() {
  const { isAuthenticated } = useAuth();

  const [locations, setLocations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(INITIAL_FORM);
  const [submitting, setSubmitting] = useState(false);

  const loadLocations = async () => {
    setLoading(true);
    setError("");

    try {
      const data = await apiAuthRequest("/locations?include_inactive=true");
      setLocations(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err.message || "Failed to load locations");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!isAuthenticated) return;
    loadLocations();
  }, [isAuthenticated]);

  const openCreate = () => {
    setEditingId(null);
    setForm(INITIAL_FORM);
    setMessage("");
    setError("");
    setModalOpen(true);
  };

  const openEdit = (location) => {
    setEditingId(location.id);
    setForm({
      name: location.name || "",
      description: location.description || "",
      latitude: String(location.latitude ?? ""),
      longitude: String(location.longitude ?? ""),
      is_active: location.is_active ? "true" : "false",
    });
    setMessage("");
    setError("");
    setModalOpen(true);
  };

  const onChange = (event) => {
    setForm((prev) => ({ ...prev, [event.target.name]: event.target.value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSubmitting(true);
    setError("");
    setMessage("");

    try {
      const payload = toPayload(form);

      if (!payload.name) throw new Error("Name is required.");
      if (!Number.isFinite(payload.latitude) || !Number.isFinite(payload.longitude)) {
        throw new Error("Latitude and longitude must be valid numbers.");
      }

      if (editingId) {
        await apiAuthRequest(`/locations/${editingId}`, { method: "PUT", body: JSON.stringify(payload) });
        setMessage("Location updated.");
      } else {
        await apiAuthRequest("/locations", { method: "POST", body: JSON.stringify(payload) });
        setMessage("Location created.");
      }

      setModalOpen(false);
      await loadLocations();
    } catch (err) {
      setError(err.message || "Failed to save location");
    } finally {
      setSubmitting(false);
    }
  };

  const setLocationActive = async (location, isActive) => {
    setError("");
    setMessage("");

    try {
      if (!isActive) {
        await apiAuthRequest(`/locations/${location.id}`, { method: "DELETE" });
        setMessage("Location deactivated.");
      } else {
        await apiAuthRequest(`/locations/${location.id}`, {
          method: "PUT",
          body: JSON.stringify({ is_active: true }),
        });
        setMessage("Location reactivated.");
      }

      await loadLocations();
    } catch (err) {
      setError(err.message || "Failed to update location status");
    }
  };

  return (
    <>
      <div style={{ display: "flex", flexDirection: "column", minHeight: "100vh" }}>
        <PageHeader onCreate={openCreate} onRefresh={loadLocations} refreshing={loading} />

        <div
          style={{
            background: "var(--color-background-tertiary)",
            flex: 1,
            padding: "28px 32px 48px",
            display: "flex",
            flexDirection: "column",
            gap: 14,
          }}
        >
          {error ? <InlineAlert tone="error">{error}</InlineAlert> : null}
          {message ? <InlineAlert tone="success">{message}</InlineAlert> : null}

          {loading ? (
            <div style={{ ...SURFACE_CARD_STYLE, padding: "40px 24px", textAlign: "center", color: "var(--color-text-tertiary)", fontSize: 14 }}>
              Loading locations...
            </div>
          ) : locations.length === 0 ? (
            <div style={{ ...SURFACE_CARD_STYLE, padding: "40px 24px", textAlign: "center", color: "var(--color-text-tertiary)", fontSize: 14 }}>
              No locations yet.
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {locations.map((location) => (
                <div key={location.id} style={{ ...SURFACE_CARD_STYLE, padding: "18px 22px" }}>
                  <div style={{ display: "flex", flexWrap: "wrap", alignItems: "flex-start", justifyContent: "space-between", gap: 12 }}>
                    <div style={{ minWidth: 0 }}>
                      <h3 style={{ margin: 0, fontSize: 16, fontWeight: 600, color: "var(--color-text-primary)" }}>{location.name}</h3>
                      <p style={{ margin: "4px 0 0", fontSize: 13, color: "var(--color-text-secondary)", lineHeight: 1.55 }}>
                        {location.description || "No description"}
                      </p>
                    </div>
                    <span style={{ display: "inline-flex", borderRadius: 999, padding: "3px 10px", fontSize: 11, fontWeight: 600, background: location.is_active ? "#EAF3DE" : "#F1EFE8", color: location.is_active ? "#3B6D11" : "#5F5E5A", textTransform: "uppercase", letterSpacing: "0.04em" }}>
                      {location.is_active ? "active" : "inactive"}
                    </span>
                  </div>

                  <p style={{ margin: "10px 0 0", fontSize: 12, color: "var(--color-text-tertiary)" }}>
                    Coordinates: {location.latitude}, {location.longitude}
                  </p>

                  <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginTop: 12 }}>
                    <ActionButton onClick={() => openEdit(location)}>Edit</ActionButton>
                    {location.is_active ? (
                      <ActionButton danger onClick={() => setLocationActive(location, false)}>Deactivate</ActionButton>
                    ) : (
                      <ActionButton onClick={() => setLocationActive(location, true)}>Reactivate</ActionButton>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editingId ? "Edit Location" : "Add Location"}>
        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <label>Name</label>
            <input name="name" value={form.name} onChange={onChange} required />
          </div>

          <div>
            <label>Description</label>
            <textarea name="description" value={form.description} onChange={onChange} rows={3} />
          </div>

          <div className="grid gap-3 md:grid-cols-2">
            <div>
              <label>Latitude</label>
              <input name="latitude" value={form.latitude} onChange={onChange} required />
            </div>
            <div>
              <label>Longitude</label>
              <input name="longitude" value={form.longitude} onChange={onChange} required />
            </div>
          </div>

          <div>
            <label>Status</label>
            <select name="is_active" value={form.is_active} onChange={onChange} className="w-full rounded-md border border-neutral-300 bg-white px-3 py-2 text-sm">
              <option value="true">Active</option>
              <option value="false">Inactive</option>
            </select>
          </div>

          <div className="flex flex-wrap gap-2 pt-1">
            <button type="submit" disabled={submitting} style={{ border: "none", borderRadius: 8, background: "#185FA5", color: "#fff", fontSize: 13, fontWeight: 500, padding: "8px 14px", cursor: submitting ? "not-allowed" : "pointer", opacity: submitting ? 0.6 : 1 }}>
              {submitting ? "Saving..." : "Save"}
            </button>
            <ActionButton onClick={() => setModalOpen(false)}>Cancel</ActionButton>
          </div>
        </form>
      </Modal>
    </>
  );
}
