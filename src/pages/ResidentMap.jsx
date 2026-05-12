import { useEffect, useMemo, useRef, useState } from "react";
import { CircleMarker, MapContainer, Popup, TileLayer, useMap } from "react-leaflet";
import { useNavigate } from "react-router-dom";
import { FaMapLocationDot } from "react-icons/fa6";
import { useAuth } from "../context/AuthContext";
import { apiAuthRequest } from "../services/api";

const MAP_CENTER = [14.425819, 120.886698];
const MAP_ZOOM = 16;
const STATUS_OPTIONS = ["all", "pending", "verified", "in_progress", "resolved", "rejected"];

const STATUS_MAP = {
  pending: { dot: "#EF9F27", fill: "#FAEEDA", text: "#854F0B", leaflet: "#d97706" },
  verified: { dot: "#378ADD", fill: "#E6F1FB", text: "#185FA5", leaflet: "#0284c7" },
  in_progress: { dot: "#7F77DD", fill: "#EEEDFE", text: "#534AB7", leaflet: "#7c3aed" },
  resolved: { dot: "#639922", fill: "#EAF3DE", text: "#3B6D11", leaflet: "#059669" },
  rejected: { dot: "#E24B4A", fill: "#FCEBEB", text: "#A32D2D", leaflet: "#dc2626" },
};

const PANEL_STYLE = {
  background: "#ffffff",
  border: "0.5px solid #DDE4EE",
  boxShadow: "0 8px 24px rgba(15,23,42,0.12), 0 2px 6px rgba(15,23,42,0.06)",
  borderRadius: 14,
  backdropFilter: "blur(8px)",
};

function toNumber(value) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function normalizeSearch(value) {
  return String(value ?? "").toLowerCase().trim();
}

function matchesSearch(query, values) {
  if (!query) return true;
  return values.some((value) => normalizeSearch(value).includes(query));
}

function MapFocus({ target }) {
  const map = useMap();

  useEffect(() => {
    if (!target) return;
    map.flyTo(target.center, Math.max(map.getZoom(), 17), { duration: 0.6 });
  }, [map, target]);

  return null;
}

function isOwnedIncident(incident, backendUser) {
  if (!incident || !backendUser) return false;
  const ownerKeys = ["reported_by", "reported_by_id", "user_id", "created_by"];
  for (const key of ownerKeys) {
    if (incident[key] == null) continue;
    if (String(incident[key]) === String(backendUser.id)) return true;
  }
  return false;
}

function LayerToggle({ active, children, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 6,
        padding: "5px 12px",
        borderRadius: 8,
        fontSize: 12,
        fontWeight: 600,
        cursor: "pointer",
        border: active ? "none" : "0.5px solid #DDE4EE",
        background: active ? "#185FA5" : "#ffffff",
        color: active ? "#ffffff" : "#64748b",
        transition: "all 0.12s",
      }}
    >
      <span
        style={{
          width: 7,
          height: 7,
          borderRadius: "50%",
          flexShrink: 0,
          background: active ? "#93c5fd" : "#cbd5e1",
        }}
      />
      {children}
    </button>
  );
}

function FloatSelect({ value, onChange, children }) {
  return (
    <div style={{ position: "relative" }}>
      <select
        value={value}
        onChange={onChange}
        style={{
          width: "100%",
          padding: "7px 30px 7px 10px",
          fontSize: 12,
          color: "#0f172a",
          background: "#ffffff",
          border: "0.5px solid #DDE4EE",
          borderRadius: 8,
          appearance: "none",
          cursor: "pointer",
          outline: "none",
          fontFamily: "inherit",
        }}
      >
        {children}
      </select>
      <svg
        width="11"
        height="11"
        viewBox="0 0 24 24"
        fill="none"
        style={{ position: "absolute", right: 9, top: "50%", transform: "translateY(-50%)", pointerEvents: "none", color: "#94a3b8" }}
      >
        <path d="M6 9l6 6 6-6" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </div>
  );
}

function LegendItem({ status }) {
  const s = STATUS_MAP[status] || { dot: "#94a3b8", text: "#64748b" };
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
      <span style={{ width: 9, height: 9, borderRadius: "50%", background: s.dot, flexShrink: 0 }} />
      <span style={{ fontSize: 11, color: "#475569", textTransform: "capitalize" }}>
        {status.replace("_", " ")}
      </span>
    </div>
  );
}

function SearchPanel({ searchTerm, setSearchTerm, incidentResults, locationResults, onSelectResult, onOpenIncident }) {
  const hasSearch = searchTerm.trim().length > 0;
  const hasResults = incidentResults.length > 0 || locationResults.length > 0;

  return (
    <div
      style={{
        position: "relative",
        width: 340,
        height: 57,
        boxSizing: "border-box",
        ...PANEL_STYLE,
        padding: 10,
        display: "flex",
        alignItems: "center",
      }}
    >
      <div style={{ position: "relative", width: "100%" }}>
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" style={{ position: "absolute", left: 11, top: "50%", transform: "translateY(-50%)", color: "#64748b", pointerEvents: "none" }}>
          <circle cx="11" cy="11" r="7" stroke="currentColor" strokeWidth="2" />
          <path d="M16.5 16.5l4 4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        </svg>
        <input
          type="search"
          value={searchTerm}
          onChange={(event) => setSearchTerm(event.target.value)}
          placeholder="Search incidents and locations"
          style={{
            width: "100%",
            boxSizing: "border-box",
            padding: "9px 12px 9px 34px",
            fontSize: 13,
            color: "#0f172a",
            background: "#f8fafc",
            border: "0.5px solid #DDE4EE",
            borderRadius: 9,
            outline: "none",
            fontFamily: "inherit",
          }}
        />
      </div>

      {hasSearch && (
        <div style={{ position: "absolute", top: "calc(100% + 8px)", left: 0, right: 0, maxHeight: 260, overflowY: "auto", display: "flex", flexDirection: "column", gap: 10, ...PANEL_STYLE, padding: 10 }}>
          {!hasResults ? (
            <p style={{ margin: 0, padding: "8px 2px", fontSize: 12, color: "#64748b" }}>No matching incidents or locations.</p>
          ) : (
            <>
              {incidentResults.length > 0 && (
                <div>
                  <p style={{ margin: "0 0 5px", fontSize: 10, fontWeight: 700, color: "#94a3b8", letterSpacing: "0.07em", textTransform: "uppercase" }}>My Incidents</p>
                  {incidentResults.slice(0, 6).map((incident) => (
                    <button key={`incident-result-${incident.id}`} type="button" onClick={() => onSelectResult("incident", incident)} style={{ width: "100%", border: "none", background: "transparent", padding: "7px 2px", display: "flex", alignItems: "flex-start", gap: 8, textAlign: "left", cursor: "pointer", borderRadius: 7 }}>
                      <span style={{ width: 8, height: 8, borderRadius: "50%", marginTop: 5, background: (STATUS_MAP[incident.status] || {}).dot || "#378ADD", flexShrink: 0 }} />
                      <span style={{ minWidth: 0 }}>
                        <span style={{ display: "block", fontSize: 12, fontWeight: 600, color: "#0f172a", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{incident.title || "Untitled incident"}</span>
                        <span style={{ display: "block", fontSize: 11, color: "#64748b", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{String(incident.status || "unknown").replace("_", " ")} · {incident.description || `${incident.latitude}, ${incident.longitude}`}</span>
                      </span>
                      <span
                        role="button"
                        tabIndex={0}
                        onClick={(event) => {
                          event.stopPropagation();
                          onOpenIncident(incident.id);
                        }}
                        onKeyDown={(event) => {
                          if (event.key === "Enter" || event.key === " ") {
                            event.preventDefault();
                            event.stopPropagation();
                            onOpenIncident(incident.id);
                          }
                        }}
                        style={{ marginLeft: "auto", flexShrink: 0, padding: "3px 7px", borderRadius: 7, background: "#EAF3DE", color: "#3B6D11", fontSize: 10, fontWeight: 700 }}
                      >
                        Details
                      </span>
                    </button>
                  ))}
                </div>
              )}

              {locationResults.length > 0 && (
                <div>
                  <p style={{ margin: "0 0 5px", fontSize: 10, fontWeight: 700, color: "#94a3b8", letterSpacing: "0.07em", textTransform: "uppercase" }}>Locations</p>
                  {locationResults.slice(0, 6).map((location) => (
                    <button key={`location-result-${location.id}`} type="button" onClick={() => onSelectResult("location", location)} style={{ width: "100%", border: "none", background: "transparent", padding: "7px 2px", display: "flex", alignItems: "flex-start", gap: 8, textAlign: "left", cursor: "pointer", borderRadius: 7 }}>
                      <span style={{ width: 8, height: 8, borderRadius: "50%", marginTop: 5, background: "#14b8a6", flexShrink: 0 }} />
                      <span style={{ minWidth: 0 }}>
                        <span style={{ display: "block", fontSize: 12, fontWeight: 600, color: "#0f172a", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{location.name || "Unnamed location"}</span>
                        <span style={{ display: "block", fontSize: 11, color: "#64748b", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{location.description || `${location.latitude}, ${location.longitude}`}</span>
                      </span>
                    </button>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}

export default function ResidentMap() {
  const { isAuthenticated, backendUser } = useAuth();
  const navigate = useNavigate();
  const markerRefs = useRef({});

  const [incidents, setIncidents] = useState([]);
  const [locations, setLocations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [focusTarget, setFocusTarget] = useState(null);
  const [showIncidents, setShowIncidents] = useState(true);
  const [showLocations, setShowLocations] = useState(true);
  const [filtersOpen, setFiltersOpen] = useState(true);

  const loadData = async () => {
    setLoading(true);
    setError("");
    try {
      const [incidentsRes, locationsRes, dashboardRes] = await Promise.allSettled([
        apiAuthRequest("/incidents/my"),
        apiAuthRequest("/locations"),
        apiAuthRequest("/dashboard"),
      ]);

      const incidentsData = incidentsRes.status === "fulfilled" ? incidentsRes.value : [];
      const directLocationsData = locationsRes.status === "fulfilled" ? locationsRes.value : [];
      const dashboardData = dashboardRes.status === "fulfilled" ? dashboardRes.value : null;
      const dashboardLocationsData = Array.isArray(dashboardData?.sections?.key_locations)
        ? dashboardData.sections.key_locations
        : [];

      setIncidents(Array.isArray(incidentsData) ? incidentsData : []);
      setLocations(
        Array.isArray(directLocationsData) && directLocationsData.length > 0
          ? directLocationsData
          : dashboardLocationsData
      );

      if (incidentsRes.status === "rejected" && locationsRes.status === "rejected" && dashboardRes.status === "rejected") {
        throw new Error("Failed to load map data");
      }
    } catch (err) {
      setError(err.message || "Failed to load map data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!isAuthenticated) return;
    loadData();
  }, [isAuthenticated]);

  const myIncidents = useMemo(() => {
    const withCoords = incidents.filter((incident) => {
      return toNumber(incident.latitude) !== null && toNumber(incident.longitude) !== null;
    });
    const owned = withCoords.filter((incident) => isOwnedIncident(incident, backendUser));
    return owned.length > 0 ? owned : withCoords;
  }, [incidents, backendUser]);

  const filteredMyIncidents = useMemo(() => {
    const query = normalizeSearch(searchTerm);
    return myIncidents.filter((incident) => {
      if (statusFilter !== "all" && incident.status !== statusFilter) return false;
      return matchesSearch(query, [
        incident.title,
        incident.description,
        incident.status,
        incident.parent_category_name,
        incident.category_name,
        incident.latitude,
        incident.longitude,
      ]);
    });
  }, [myIncidents, searchTerm, statusFilter]);

  const mapLocations = useMemo(() => {
    const query = normalizeSearch(searchTerm);
    return locations.filter((loc) => {
      if (!matchesSearch(query, [loc.name, loc.description, loc.latitude, loc.longitude])) return false;
      return toNumber(loc.latitude) !== null && toNumber(loc.longitude) !== null;
    });
  }, [locations, searchTerm]);

  const selectSearchResult = (type, item) => {
    const lat = toNumber(item.latitude);
    const lng = toNumber(item.longitude);
    if (lat === null || lng === null) return;
    if (type === "incident") setShowIncidents(true);
    if (type === "location") setShowLocations(true);
    setFocusTarget({ type, id: item.id, center: [lat, lng] });
  };

  useEffect(() => {
    if (!focusTarget) return undefined;
    const markerKey = `${focusTarget.type}-${focusTarget.id}`;
    const timer = window.setTimeout(() => {
      markerRefs.current[markerKey]?.openPopup?.();
    }, 650);
    return () => window.clearTimeout(timer);
  }, [focusTarget]);

  return (
    <div
      className="-mx-4 -my-4 md:-mx-6 md:-my-5"
      style={{
        position: "relative",
        width: "auto",
        height: "100vh",
        minHeight: 560,
        zIndex: 0,
      }}
    >
      <MapContainer
        center={MAP_CENTER}
        zoom={MAP_ZOOM}
        scrollWheelZoom
        style={{ width: "100%", height: "100%" }}
        zoomControl={false}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <MapFocus target={focusTarget} />

        {showIncidents && filteredMyIncidents.map((incident) => {
          const lat = toNumber(incident.latitude);
          const lng = toNumber(incident.longitude);
          if (lat === null || lng === null) return null;
          const s = STATUS_MAP[incident.status] || { leaflet: "#374151" };
          return (
            <CircleMarker
              key={`incident-${incident.id}`}
              ref={(marker) => {
                markerRefs.current[`incident-${incident.id}`] = marker;
              }}
              center={[lat, lng]}
              radius={8}
              pathOptions={{ color: s.leaflet, fillColor: s.leaflet, fillOpacity: 0.85, weight: 2 }}
            >
              <Popup>
                <div style={{ minWidth: 180, fontFamily: "inherit" }}>
                  <p style={{ margin: "0 0 6px", fontSize: 13, fontWeight: 600, color: "#0f172a" }}>
                    {incident.title}
                  </p>
                  <div style={{ display: "flex", flexDirection: "column", gap: 3 }}>
                    <span style={{ fontSize: 11, color: "#64748b" }}>
                      Status: <strong style={{ color: "#0f172a" }}>{String(incident.status || "unknown").replace("_", " ")}</strong>
                    </span>
                    <span style={{ fontSize: 11, color: "#64748b" }}>
                      {new Date(incident.created_at).toLocaleString()}
                    </span>
                    <button
                      type="button"
                      onClick={() => navigate(`/resident/incidents/${incident.id}`)}
                      style={{
                        marginTop: 5,
                        alignSelf: "flex-start",
                        padding: "5px 8px",
                        borderRadius: 7,
                        border: "0.5px solid #C0DD97",
                        background: "#EAF3DE",
                        color: "#3B6D11",
                        fontSize: 11,
                        fontWeight: 700,
                        cursor: "pointer",
                      }}
                    >
                      Open details
                    </button>
                  </div>
                </div>
              </Popup>
            </CircleMarker>
          );
        })}

        {showLocations && mapLocations.map((location) => {
          const lat = toNumber(location.latitude);
          const lng = toNumber(location.longitude);
          if (lat === null || lng === null) return null;
          return (
            <CircleMarker
              key={`location-${location.id}`}
              ref={(marker) => {
                markerRefs.current[`location-${location.id}`] = marker;
              }}
              center={[lat, lng]}
              radius={7}
              pathOptions={{ color: "#0f766e", fillColor: "#14b8a6", fillOpacity: 0.9, weight: 2 }}
            >
              <Popup>
                <div style={{ minWidth: 160, fontFamily: "inherit" }}>
                  <p style={{ margin: "0 0 6px", fontSize: 13, fontWeight: 600, color: "#0f172a" }}>
                    {location.name}
                  </p>
                  <span style={{ fontSize: 11, color: "#64748b" }}>{location.description || "No description"}</span>
                </div>
              </Popup>
            </CircleMarker>
          );
        })}
      </MapContainer>

      <div
        style={{
          position: "absolute",
          top: 16,
          left: 16,
          zIndex: 800,
          display: "flex",
          alignItems: "flex-start",
          gap: 8,
        }}
      >
      <div
        style={{
          ...PANEL_STYLE,
          padding: "10px 16px",
          display: "flex",
          alignItems: "center",
          gap: 12,
        }}
      >
        <div
          style={{
            width: 34,
            height: 34,
            borderRadius: 9,
            background: "#EAF3DE",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
          }}
        >
          <FaMapLocationDot style={{ fontSize: 18, color: "#3B6D11" }} />
        </div>
        <div>
          <div style={{ display: "flex", alignItems: "baseline", gap: 7 }}>
            <h1 style={{ margin: 0, fontSize: 15, fontWeight: 600, color: "#0f172a", lineHeight: 1.2 }}>
              Map
            </h1>
            <span
              style={{
                fontSize: 9,
                fontWeight: 700,
                letterSpacing: "0.07em",
                textTransform: "uppercase",
                background: "#EAF3DE",
                color: "#3B6D11",
                padding: "1px 7px",
                borderRadius: 999,
              }}
            >
              Resident
            </span>
          </div>
          <p style={{ margin: "2px 0 0", fontSize: 11, color: "#64748b" }}>
            Locations and reports you submitted
          </p>
        </div>
      </div>
        <SearchPanel
          searchTerm={searchTerm}
          setSearchTerm={setSearchTerm}
          incidentResults={filteredMyIncidents}
          locationResults={mapLocations}
          onSelectResult={selectSearchResult}
          onOpenIncident={(incidentId) => navigate(`/resident/incidents/${incidentId}`)}
        />
      </div>

      <div
        style={{
          position: "absolute",
          top: 16,
          right: 16,
          zIndex: 800,
          display: "flex",
          alignItems: "center",
          gap: 8,
        }}
      >
        {!loading && (
          <>
            <div style={{ ...PANEL_STYLE, padding: "6px 12px", display: "flex", alignItems: "center", gap: 6 }}>
              <span style={{ width: 8, height: 8, borderRadius: "50%", background: "#378ADD" }} />
              <span style={{ fontSize: 12, color: "#0f172a", fontWeight: 500 }}>
                {showIncidents ? filteredMyIncidents.length : 0} incidents
              </span>
            </div>
            <div style={{ ...PANEL_STYLE, padding: "6px 12px", display: "flex", alignItems: "center", gap: 6 }}>
              <span style={{ width: 8, height: 8, borderRadius: "50%", background: "#14b8a6" }} />
              <span style={{ fontSize: 12, color: "#0f172a", fontWeight: 500 }}>
                {showLocations ? mapLocations.length : 0} locations
              </span>
            </div>
          </>
        )}

        <button
          type="button"
          onClick={loadData}
          disabled={loading}
          title="Refresh data"
          style={{
            ...PANEL_STYLE,
            width: 36,
            height: 36,
            padding: 0,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            cursor: loading ? "not-allowed" : "pointer",
            border: "0.5px solid #DDE4EE",
            borderRadius: 10,
            background: "#ffffff",
            opacity: loading ? 0.6 : 1,
          }}
        >
          ↻
        </button>
      </div>

      <div
        style={{
          position: "absolute",
          bottom: 24,
          left: 16,
          zIndex: 800,
          width: 260,
          ...PANEL_STYLE,
          padding: 0,
          overflow: "hidden",
        }}
      >
        <button
          type="button"
          onClick={() => setFiltersOpen((prev) => !prev)}
          style={{
            width: "100%",
            padding: "11px 14px",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            background: "transparent",
            border: "none",
            cursor: "pointer",
            borderBottom: filtersOpen ? "0.5px solid #DDE4EE" : "none",
          }}
        >
          <span style={{ fontSize: 11, fontWeight: 700, color: "#475569", letterSpacing: "0.07em", textTransform: "uppercase" }}>
            Filters
          </span>
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" style={{ transition: "transform 0.2s", transform: filtersOpen ? "rotate(0deg)" : "rotate(180deg)" }}>
            <path d="M6 9l6 6 6-6" stroke="#94a3b8" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>

        {filtersOpen && (
          <div style={{ padding: "12px 14px", display: "flex", flexDirection: "column", gap: 10 }}>
            <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
              <label style={{ fontSize: 10, fontWeight: 700, color: "#94a3b8", letterSpacing: "0.07em", textTransform: "uppercase" }}>
                Incident Status
              </label>
              <FloatSelect value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
                {STATUS_OPTIONS.map((s) => (
                  <option key={s} value={s}>
                    {s === "all" ? "All statuses" : s.replace("_", " ")}
                  </option>
                ))}
              </FloatSelect>
            </div>

            <div style={{ display: "flex", gap: 6, paddingTop: 2 }}>
              <LayerToggle active={showIncidents} onClick={() => setShowIncidents((prev) => !prev)}>
                My Incidents
              </LayerToggle>
              <LayerToggle active={showLocations} onClick={() => setShowLocations((prev) => !prev)}>
                Locations
              </LayerToggle>
            </div>
          </div>
        )}
      </div>

      <div
        style={{
          position: "absolute",
          bottom: 24,
          right: 16,
          zIndex: 800,
          ...PANEL_STYLE,
          padding: "10px 14px",
          display: "flex",
          flexDirection: "column",
          gap: 6,
          minWidth: 130,
        }}
      >
        <p style={{ margin: 0, fontSize: 10, fontWeight: 700, color: "#94a3b8", letterSpacing: "0.07em", textTransform: "uppercase", marginBottom: 2 }}>
          Legend
        </p>
        {Object.keys(STATUS_MAP).map((s) => <LegendItem key={s} status={s} />)}
        <div style={{ borderTop: "0.5px solid #DDE4EE", marginTop: 2, paddingTop: 6, display: "flex", alignItems: "center", gap: 6 }}>
          <span style={{ width: 9, height: 9, borderRadius: "50%", background: "#14b8a6", flexShrink: 0 }} />
          <span style={{ fontSize: 11, color: "#475569" }}>Location</span>
        </div>
      </div>

      {error && (
        <div
          style={{
            position: "absolute",
            top: 70,
            left: "50%",
            transform: "translateX(-50%)",
            zIndex: 900,
            background: "#FCEBEB",
            border: "0.5px solid #F09595",
            borderRadius: 10,
            padding: "10px 16px",
            fontSize: 13,
            color: "#A32D2D",
          }}
        >
          {error}
        </div>
      )}
    </div>
  );
}
