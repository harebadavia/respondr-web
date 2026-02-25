import { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { apiRequest } from "../services/api";
import Card from "../components/ui/Card";
import Alert from "../components/ui/Alert";
import Button from "../components/ui/Button";
import Input from "../components/ui/Input";
import Textarea from "../components/ui/Textarea";
import Modal from "../components/ui/Modal";

const INITIAL_FORM = {
  name: "",
  description: "",
  latitude: "",
  longitude: "",
  is_active: "true",
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

export default function OfficialLocations() {
  const { token } = useAuth();

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
      const data = await apiRequest("/locations?include_inactive=true", {
        headers: { Authorization: `Bearer ${token}` },
      });
      setLocations(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err.message || "Failed to load locations");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!token) return;
    loadLocations();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

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
    setForm((prev) => ({
      ...prev,
      [event.target.name]: event.target.value,
    }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSubmitting(true);
    setError("");
    setMessage("");

    try {
      const payload = toPayload(form);

      if (!payload.name) {
        throw new Error("Name is required.");
      }
      if (!Number.isFinite(payload.latitude) || !Number.isFinite(payload.longitude)) {
        throw new Error("Latitude and longitude must be valid numbers.");
      }

      if (editingId) {
        await apiRequest(`/locations/${editingId}`, {
          method: "PUT",
          headers: { Authorization: `Bearer ${token}` },
          body: JSON.stringify(payload),
        });
        setMessage("Location updated.");
      } else {
        await apiRequest("/locations", {
          method: "POST",
          headers: { Authorization: `Bearer ${token}` },
          body: JSON.stringify(payload),
        });
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
        await apiRequest(`/locations/${location.id}`, {
          method: "DELETE",
          headers: { Authorization: `Bearer ${token}` },
        });
        setMessage("Location deactivated.");
      } else {
        await apiRequest(`/locations/${location.id}`, {
          method: "PUT",
          headers: { Authorization: `Bearer ${token}` },
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
    <section className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900">Locations</h1>
          <p className="text-sm text-neutral-600">Manage barangay landmarks and evacuation points.</p>
        </div>
        <Button onClick={openCreate}>Add Location</Button>
      </div>

      {error && <Alert tone="error">{error}</Alert>}
      {message && <Alert tone="success">{message}</Alert>}

      {loading ? (
        <Card><p className="text-neutral-600">Loading locations...</p></Card>
      ) : locations.length === 0 ? (
        <Card><p className="text-neutral-600">No locations yet.</p></Card>
      ) : (
        <div className="space-y-3">
          {locations.map((location) => (
            <Card key={location.id} className="space-y-3">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <h3 className="text-lg font-semibold text-neutral-900">{location.name}</h3>
                  <p className="text-sm text-neutral-600">{location.description || "No description"}</p>
                </div>
                <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold uppercase tracking-wide ${location.is_active ? "bg-emerald-100 text-emerald-800" : "bg-neutral-200 text-neutral-700"}`}>
                  {location.is_active ? "active" : "inactive"}
                </span>
              </div>

              <div className="text-sm text-neutral-600">
                <p>Coordinates: {location.latitude}, {location.longitude}</p>
              </div>

              <div className="flex flex-wrap gap-2">
                <Button variant="secondary" onClick={() => openEdit(location)}>Edit</Button>
                {location.is_active ? (
                  <Button variant="danger" onClick={() => setLocationActive(location, false)}>Deactivate</Button>
                ) : (
                  <Button variant="secondary" onClick={() => setLocationActive(location, true)}>Reactivate</Button>
                )}
              </div>
            </Card>
          ))}
        </div>
      )}

      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editingId ? "Edit Location" : "Add Location"}
      >
        <form onSubmit={handleSubmit} className="space-y-3">
          <Input name="name" label="Name" value={form.name} onChange={onChange} required />
          <Textarea name="description" label="Description" value={form.description} onChange={onChange} rows={3} />

          <div className="grid gap-3 md:grid-cols-2">
            <Input name="latitude" label="Latitude" value={form.latitude} onChange={onChange} required />
            <Input name="longitude" label="Longitude" value={form.longitude} onChange={onChange} required />
          </div>

          <div>
            <label>Status</label>
            <select
              name="is_active"
              value={form.is_active}
              onChange={onChange}
              className="w-full rounded-md border border-neutral-300 bg-white px-3 py-2 text-sm"
            >
              <option value="true">Active</option>
              <option value="false">Inactive</option>
            </select>
          </div>

          <div className="flex flex-wrap gap-2 pt-1">
            <Button type="submit" disabled={submitting}>{submitting ? "Saving..." : "Save"}</Button>
            <Button type="button" variant="secondary" onClick={() => setModalOpen(false)}>Cancel</Button>
          </div>
        </form>
      </Modal>
    </section>
  );
}
