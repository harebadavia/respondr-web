import { useEffect, useMemo, useState } from "react";
import { CircleMarker, MapContainer, Popup, TileLayer } from "react-leaflet";
import { useAuth } from "../context/AuthContext";
import { apiRequest } from "../services/api";
import Card from "../components/ui/Card";
import Alert from "../components/ui/Alert";
import Button from "../components/ui/Button";

const MAP_CENTER = [14.425819, 120.886698];
const MAP_ZOOM = 16;
const statusOptions = ["all", "pending", "verified", "in_progress", "resolved", "rejected"];

const statusColors = {
  pending: "#d97706",
  verified: "#0284c7",
  in_progress: "#7c3aed",
  resolved: "#059669",
  rejected: "#dc2626",
};

function toNumber(value) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function categoryText(incident) {
  const parent = incident.parent_category_name || "Uncategorized";
  return incident.category_name ? `${parent} > ${incident.category_name}` : parent;
}

export default function OfficialMap() {
  const { token } = useAuth();

  const [incidents, setIncidents] = useState([]);
  const [locations, setLocations] = useState([]);
  const [categories, setCategories] = useState([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [statusFilter, setStatusFilter] = useState("all");
  const [parentCategoryFilter, setParentCategoryFilter] = useState("all");
  const [subcategoryFilter, setSubcategoryFilter] = useState("all");
  const [showIncidents, setShowIncidents] = useState(true);
  const [showLocations, setShowLocations] = useState(true);

  const loadData = async () => {
    setLoading(true);
    setError("");

    try {
      const [incidentsData, locationsData, categoriesData] = await Promise.all([
        apiRequest("/incidents", {
          headers: { Authorization: `Bearer ${token}` },
        }),
        apiRequest("/locations?include_inactive=true", {
          headers: { Authorization: `Bearer ${token}` },
        }),
        apiRequest("/incident-categories", {
          headers: { Authorization: `Bearer ${token}` },
        }),
      ]);

      setIncidents(Array.isArray(incidentsData) ? incidentsData : []);
      setLocations(Array.isArray(locationsData) ? locationsData : []);
      setCategories(Array.isArray(categoriesData) ? categoriesData : []);
    } catch (err) {
      setError(err.message || "Failed to load map data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!token) return;
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  const parentCategoryOptions = categories;
  const selectedParent = categories.find((cat) => cat.id === parentCategoryFilter);

  const filteredIncidents = useMemo(() => {
    return incidents.filter((incident) => {
      if (statusFilter !== "all" && incident.status !== statusFilter) return false;

      if (parentCategoryFilter !== "all") {
        if (incident.parent_category_name !== selectedParent?.name) return false;
      }

      if (subcategoryFilter !== "all") {
        if (incident.category_id !== subcategoryFilter) return false;
      }

      const lat = toNumber(incident.latitude);
      const lng = toNumber(incident.longitude);
      return lat !== null && lng !== null;
    });
  }, [incidents, statusFilter, parentCategoryFilter, subcategoryFilter, selectedParent]);

  const filteredLocations = useMemo(() => {
    return locations.filter((location) => {
      const lat = toNumber(location.latitude);
      const lng = toNumber(location.longitude);
      return lat !== null && lng !== null;
    });
  }, [locations]);

  const resetFilters = () => {
    setStatusFilter("all");
    setParentCategoryFilter("all");
    setSubcategoryFilter("all");
    setShowIncidents(true);
    setShowLocations(true);
  };

  return (
    <section className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900">Operations Map</h1>
          <p className="text-sm text-neutral-600">Incident and barangay location visualization (OpenStreetMap).</p>
        </div>
        <Button variant="secondary" onClick={loadData}>Refresh Data</Button>
      </div>

      <Card>
        <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
          <div>
            <label>Status</label>
            <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="w-full rounded-md border border-neutral-300 bg-white px-3 py-2 text-sm">
              {statusOptions.map((status) => (
                <option key={status} value={status}>
                  {status === "all" ? "All statuses" : status.replace("_", " ")}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label>Category</label>
            <select
              value={parentCategoryFilter}
              onChange={(e) => {
                setParentCategoryFilter(e.target.value);
                setSubcategoryFilter("all");
              }}
              className="w-full rounded-md border border-neutral-300 bg-white px-3 py-2 text-sm"
            >
              <option value="all">All categories</option>
              {parentCategoryOptions.map((category) => (
                <option key={category.id} value={category.id}>{category.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label>Subcategory</label>
            <select
              value={subcategoryFilter}
              onChange={(e) => setSubcategoryFilter(e.target.value)}
              className="w-full rounded-md border border-neutral-300 bg-white px-3 py-2 text-sm"
              disabled={parentCategoryFilter === "all"}
            >
              <option value="all">All subcategories</option>
              {(selectedParent?.subcategories || []).map((subcategory) => (
                <option key={subcategory.id} value={subcategory.id}>{subcategory.name}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="mt-3 flex flex-wrap items-center gap-2">
          <Button
            variant={showIncidents ? "primary" : "secondary"}
            className="px-3 py-1.5 text-xs"
            onClick={() => setShowIncidents((prev) => !prev)}
          >
            {showIncidents ? "Incidents: ON" : "Incidents: OFF"}
          </Button>
          <Button
            variant={showLocations ? "primary" : "secondary"}
            className="px-3 py-1.5 text-xs"
            onClick={() => setShowLocations((prev) => !prev)}
          >
            {showLocations ? "Locations: ON" : "Locations: OFF"}
          </Button>
          <Button variant="secondary" className="ml-auto" onClick={resetFilters}>Reset Filters</Button>
        </div>
      </Card>

      {error && <Alert tone="error">{error}</Alert>}
      {loading && <Card><p className="text-neutral-600">Loading map data...</p></Card>}

      {!loading && (
        <Card>
          <div className="mb-3 flex flex-wrap gap-4 text-sm text-neutral-600">
            <p>Incidents shown: {showIncidents ? filteredIncidents.length : 0}</p>
            <p>Locations shown: {showLocations ? filteredLocations.length : 0}</p>
          </div>

          <div className="h-[68vh] overflow-hidden rounded-md border border-neutral-200">
            <MapContainer center={MAP_CENTER} zoom={MAP_ZOOM} scrollWheelZoom className="h-full w-full">
              <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap contributors</a>'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              />

              {showIncidents &&
                filteredIncidents.map((incident) => {
                  const lat = toNumber(incident.latitude);
                  const lng = toNumber(incident.longitude);
                  if (lat === null || lng === null) return null;

                  const color = statusColors[incident.status] || "#374151";

                  return (
                    <CircleMarker
                      key={`incident-${incident.id}`}
                      center={[lat, lng]}
                      radius={8}
                      pathOptions={{ color, fillColor: color, fillOpacity: 0.8 }}
                    >
                      <Popup>
                        <div className="space-y-1">
                          <p className="font-semibold">{incident.title}</p>
                          <p className="text-xs">Status: {incident.status.replace("_", " ")}</p>
                          <p className="text-xs">Category: {categoryText(incident)}</p>
                          <p className="text-xs">Created: {new Date(incident.created_at).toLocaleString()}</p>
                        </div>
                      </Popup>
                    </CircleMarker>
                  );
                })}

              {showLocations &&
                filteredLocations.map((location) => {
                  const lat = toNumber(location.latitude);
                  const lng = toNumber(location.longitude);
                  if (lat === null || lng === null) return null;

                  return (
                    <CircleMarker
                      key={`location-${location.id}`}
                      center={[lat, lng]}
                      radius={7}
                      pathOptions={{ color: "#0f766e", fillColor: "#14b8a6", fillOpacity: 0.9 }}
                    >
                      <Popup>
                        <div className="space-y-1">
                          <p className="font-semibold">{location.name}</p>
                          <p className="text-xs">{location.description || "No description"}</p>
                          <p className="text-xs">{lat}, {lng}</p>
                          <p className="text-xs">{location.is_active ? "Active" : "Inactive"}</p>
                        </div>
                      </Popup>
                    </CircleMarker>
                  );
                })}
            </MapContainer>
          </div>
        </Card>
      )}
    </section>
  );
}
