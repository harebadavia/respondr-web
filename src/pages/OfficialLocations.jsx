import { useEffect, useMemo, useState } from "react";
import { CircleMarker, MapContainer, TileLayer, useMap, useMapEvents } from "react-leaflet";
import { useAuth } from "../context/AuthContext";
import { apiAuthRequest } from "../services/api";
import Modal from "../components/ui/Modal";
import RolePageHeader from "../components/ui/RolePageHeader";
import Button from "../components/ui/Button";
import { ListToolbar, Pagination } from "../components/ui/ListControls";
import { paginateItems } from "../components/ui/listControlUtils";
import { FaLocationDot } from "react-icons/fa6";

const DEFAULT_CENTER = [14.425819, 120.886698];

const INITIAL_FORM = {
  name: "",
  description: "",
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
    is_active: form.is_active === "true",
  };
}

function MapClickHandler({ onPick }) {
  useMapEvents({
    click(event) {
      onPick(event.latlng.lat, event.latlng.lng);
    },
  });
  return null;
}

function MapViewport({ center }) {
  const map = useMap();
  useEffect(() => {
    if (!center) return;
    map.setView(center, 16);
  }, [center, map]);
  return null;
}

function ActionButton({ children, onClick, disabled, danger }) {
  return (
    <Button
      onClick={onClick}
      disabled={disabled}
      variant={danger ? "danger" : "secondary"}
    >
      {children}
    </Button>
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
    <RolePageHeader
      title="Locations"
      subtitle="Manage barangay landmarks and evacuation points."
      role="official"
      icon={FaLocationDot}
      right={(
        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          <ActionButton onClick={onRefresh} disabled={refreshing}>
            {refreshing ? "Refreshing..." : "Refresh"}
          </ActionButton>
          <Button type="button" onClick={onCreate}>
            Add Location
          </Button>
        </div>
      )}
    />
  );
}

export default function OfficialLocations() {
  const { isAuthenticated } = useAuth();

  const [locations, setLocations] = useState([]);
  const [locationSearchTerm, setLocationSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(INITIAL_FORM);
  const [submitting, setSubmitting] = useState(false);
  const [pickedPoint, setPickedPoint] = useState(null);
  const [mapCenter, setMapCenter] = useState(DEFAULT_CENTER);
  const [searchQuery, setSearchQuery] = useState("");
  const [searching, setSearching] = useState(false);
  const [searchResults, setSearchResults] = useState([]);

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

  const filteredLocations = useMemo(() => {
    const query = locationSearchTerm.trim().toLowerCase();
    return locations.filter((location) => {
      if (statusFilter === "active" && !location.is_active) return false;
      if (statusFilter === "inactive" && location.is_active) return false;
      if (!query) return true;
      return [
        location.name,
        location.description,
        location.is_active ? "active" : "inactive",
        location.latitude,
        location.longitude,
      ].join(" ").toLowerCase().includes(query);
    });
  }, [locations, locationSearchTerm, statusFilter]);

  useEffect(() => {
    setPage(1);
  }, [locationSearchTerm, statusFilter, pageSize]);

  const pagination = paginateItems(filteredLocations, page, pageSize);

  const openCreate = () => {
    setEditingId(null);
    setForm(INITIAL_FORM);
    setPickedPoint(null);
    setMapCenter(DEFAULT_CENTER);
    setSearchQuery("");
    setSearchResults([]);
    setMessage("");
    setError("");
    setModalOpen(true);
  };

  const openEdit = (location) => {
    setEditingId(location.id);
    setForm({
      name: location.name || "",
      description: location.description || "",
      is_active: location.is_active ? "true" : "false",
    });
    if (Number.isFinite(Number(location.latitude)) && Number.isFinite(Number(location.longitude))) {
      const point = [Number(location.latitude), Number(location.longitude)];
      setPickedPoint(point);
      setMapCenter(point);
    } else {
      setPickedPoint(null);
      setMapCenter(DEFAULT_CENTER);
    }
    setSearchQuery("");
    setSearchResults([]);
    setMessage("");
    setError("");
    setModalOpen(true);
  };

  const onChange = (event) => {
    setForm((prev) => ({ ...prev, [event.target.name]: event.target.value }));
  };

  const onPickPoint = (lat, lng) => {
    const point = [lat, lng];
    setPickedPoint(point);
    setMapCenter(point);
  };

  const searchPlaces = async () => {
    const q = searchQuery.trim();
    if (!q) return;
    setSearching(true);
    setError("");
    try {
      const params = new URLSearchParams({
        q,
        format: "jsonv2",
        limit: "5",
      });
      const response = await fetch(`https://nominatim.openstreetmap.org/search?${params.toString()}`);
      if (!response.ok) {
        throw new Error("Place search failed.");
      }
      const data = await response.json();
      setSearchResults(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err.message || "Unable to search places.");
    } finally {
      setSearching(false);
    }
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSubmitting(true);
    setError("");
    setMessage("");

    try {
      const payload = toPayload(form);
      const lat = pickedPoint?.[0];
      const lng = pickedPoint?.[1];

      if (!payload.name) throw new Error("Name is required.");
      if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
        throw new Error("Please pin a location on the map.");
      }
      payload.latitude = lat;
      payload.longitude = lng;

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
      <section className="space-y-4">
        <PageHeader onCreate={openCreate} onRefresh={loadLocations} refreshing={loading} />

        <div
          style={{
            background: "var(--color-background-tertiary)",
            display: "flex",
            flexDirection: "column",
            gap: 16,
            borderRadius: 16,
          }}
        >
          {error ? <InlineAlert tone="error">{error}</InlineAlert> : null}
          {message ? <InlineAlert tone="success">{message}</InlineAlert> : null}

          <ListToolbar
            searchValue={locationSearchTerm}
            onSearchChange={setLocationSearchTerm}
            searchPlaceholder="Search locations"
            filters={[
              {
                id: "status",
                label: "Status",
                value: statusFilter,
                onChange: setStatusFilter,
                options: [
                  { value: "all", label: "All statuses" },
                  { value: "active", label: "Active" },
                  { value: "inactive", label: "Inactive" },
                ],
              },
            ]}
            pageSize={pageSize}
            onPageSizeChange={setPageSize}
          />

          {loading ? (
            <div style={{ ...SURFACE_CARD_STYLE, padding: "40px 24px", textAlign: "center", color: "var(--color-text-tertiary)", fontSize: 14 }}>
              Loading locations...
            </div>
          ) : locations.length === 0 ? (
            <div style={{ ...SURFACE_CARD_STYLE, padding: "40px 24px", textAlign: "center", color: "var(--color-text-tertiary)", fontSize: 14 }}>
              No locations yet.
            </div>
          ) : filteredLocations.length === 0 ? (
            <div style={{ ...SURFACE_CARD_STYLE, padding: "40px 24px", textAlign: "center", color: "var(--color-text-tertiary)", fontSize: 14 }}>
              No locations match your search.
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              {pagination.pageItems.map((location) => (
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

          {!loading && filteredLocations.length > 0 ? (
            <Pagination
              page={pagination.safePage}
              totalPages={pagination.totalPages}
              totalItems={filteredLocations.length}
              start={pagination.start}
              end={pagination.end}
              onPageChange={setPage}
            />
          ) : null}
        </div>
      </section>

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

          <div>
            <label>Search Place</label>
            <div className="flex gap-2">
              <input
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
                placeholder="Search address or landmark"
              />
              <Button
                type="button"
                variant="secondary"
                onClick={searchPlaces}
                disabled={searching || !searchQuery.trim()}
              >
                {searching ? "Searching..." : "Search"}
              </Button>
            </div>
          </div>

          {searchResults.length > 0 ? (
            <div style={{ border: "1px solid var(--color-border-tertiary)", borderRadius: 10, maxHeight: 140, overflowY: "auto", padding: 8 }}>
              {searchResults.map((result) => (
                <button
                  key={result.place_id}
                  type="button"
                  onClick={() => onPickPoint(Number(result.lat), Number(result.lon))}
                  style={{
                    width: "100%",
                    textAlign: "left",
                    border: "none",
                    background: "transparent",
                    padding: "8px 6px",
                    cursor: "pointer",
                    fontSize: 12,
                    color: "var(--color-text-secondary)",
                  }}
                >
                  {result.display_name}
                </button>
              ))}
            </div>
          ) : null}

          <div>
            <label>Pin Location</label>
            <div style={{ border: "1px solid var(--color-border-tertiary)", borderRadius: 12, overflow: "hidden" }}>
              <MapContainer
                center={mapCenter}
                zoom={16}
                style={{ width: "100%", height: 280 }}
                scrollWheelZoom
              >
                <TileLayer
                  attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />
                <MapClickHandler onPick={onPickPoint} />
                <MapViewport center={mapCenter} />
                {pickedPoint ? (
                  <CircleMarker
                    center={pickedPoint}
                    radius={8}
                    pathOptions={{ color: "#0f766e", fillColor: "#14b8a6", fillOpacity: 0.9, weight: 2 }}
                  />
                ) : null}
              </MapContainer>
            </div>
            <p style={{ margin: "8px 0 0", fontSize: 12, color: "var(--color-text-tertiary)" }}>
              Click on the map to pin a location.
              {pickedPoint ? ` Pinned: ${pickedPoint[0].toFixed(6)}, ${pickedPoint[1].toFixed(6)}` : ""}
            </p>
          </div>

          <div>
            <label>Status</label>
            <select name="is_active" value={form.is_active} onChange={onChange} className="w-full rounded-md border border-neutral-300 bg-white px-3 py-2 text-sm">
              <option value="true">Active</option>
              <option value="false">Inactive</option>
            </select>
          </div>

          <div className="flex flex-wrap gap-2 pt-1">
            <Button type="submit" disabled={submitting}>
              {submitting ? "Saving..." : "Save"}
            </Button>
            <ActionButton onClick={() => setModalOpen(false)}>Cancel</ActionButton>
          </div>
        </form>
      </Modal>
    </>
  );
}
