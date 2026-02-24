import { useState } from "react";
import { useAuth } from "../context/AuthContext";
import { apiRequest } from "../services/api";
import { uploadIncidentImage } from "../services/storage";

export default function ResidentIncidentsNew() {
  const { token, firebaseUser } = useAuth();
  const [form, setForm] = useState({
    title: "",
    description: "",
    incident_type: "",
    latitude: "",
    longitude: "",
  });
  const [imageFile, setImageFile] = useState(null);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState(null);
  const [pendingAttachment, setPendingAttachment] = useState(null);

  const onChange = (e) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const applyBrowserLocation = () => {
    if (!navigator.geolocation) {
      setError("Geolocation is not supported by this browser.");
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setForm((prev) => ({
          ...prev,
          latitude: String(position.coords.latitude),
          longitude: String(position.coords.longitude),
        }));
      },
      () => {
        setError("Unable to get current location.");
      },
      { enableHighAccuracy: true }
    );
  };

  const registerAttachment = async (incidentId, metadata) => {
    return apiRequest(`/incidents/${incidentId}/attachments`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(metadata),
    });
  };

  const handleRetryAttachment = async () => {
    if (!pendingAttachment) return;

    try {
      await registerAttachment(pendingAttachment.incidentId, pendingAttachment.metadata);
      setPendingAttachment(null);
      setResult((prev) => ({
        ...prev,
        attachmentRegistered: true,
      }));
      setError("");
    } catch (err) {
      setError(`Attachment retry failed: ${err.message}`);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSubmitting(true);
    setResult(null);
    setPendingAttachment(null);

    try {
      const incidentPayload = {
        title: form.title.trim(),
        description: form.description.trim(),
        incident_type: form.incident_type.trim() || null,
        latitude: Number(form.latitude),
        longitude: Number(form.longitude),
      };

      if (!Number.isFinite(incidentPayload.latitude) || !Number.isFinite(incidentPayload.longitude)) {
        throw new Error("Latitude and longitude are required numbers.");
      }

      const incident = await apiRequest("/incidents", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(incidentPayload),
      });

      const attemptedImageUpload = Boolean(imageFile);
      let attachmentRegistered = false;

      if (attemptedImageUpload) {
        const metadata = await uploadIncidentImage({
          file: imageFile,
          firebaseUid: firebaseUser?.uid,
          incidentId: incident.id,
        });

        try {
          await registerAttachment(incident.id, metadata);
          attachmentRegistered = true;
        } catch (err) {
          setPendingAttachment({ incidentId: incident.id, metadata });
          setError(`Incident saved, but attachment metadata registration failed: ${err.message}`);
        }
      }

      setResult({ incident, attachmentRegistered, attemptedImageUpload });
      setForm({
        title: "",
        description: "",
        incident_type: "",
        latitude: "",
        longitude: "",
      });
      setImageFile(null);
    } catch (err) {
      setError(err.message || "Failed to create incident.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <section>
      <h1>New Incident Report</h1>

      <form onSubmit={handleSubmit} style={{ display: "grid", gap: 12, maxWidth: 520 }}>
        <div>
          <label>Title</label>
          <input name="title" value={form.title} onChange={onChange} required />
        </div>

        <div>
          <label>Description</label>
          <textarea name="description" value={form.description} onChange={onChange} required rows={4} />
        </div>

        <div>
          <label>Incident Type (optional)</label>
          <input name="incident_type" value={form.incident_type} onChange={onChange} placeholder="Flood, Fire, Landslide" />
        </div>

        <div style={{ display: "flex", gap: 8 }}>
          <div style={{ flex: 1 }}>
            <label>Latitude</label>
            <input name="latitude" value={form.latitude} onChange={onChange} required />
          </div>
          <div style={{ flex: 1 }}>
            <label>Longitude</label>
            <input name="longitude" value={form.longitude} onChange={onChange} required />
          </div>
        </div>

        <button type="button" onClick={applyBrowserLocation} style={{ width: "fit-content" }}>
          Use Current Location
        </button>

        <div>
          <label>Image (optional, 1 file, auto-compressed to &lt; 400KB)</label>
          <input
            type="file"
            accept="image/jpeg,image/webp,image/*"
            onChange={(e) => {
              const nextFile = e.target.files && e.target.files[0] ? e.target.files[0] : null;
              setImageFile(nextFile);
            }}
          />
        </div>

        <button type="submit" disabled={submitting}>
          {submitting ? "Submitting..." : "Submit Incident"}
        </button>
      </form>

      {error && <p style={{ color: "red", marginTop: 12 }}>{error}</p>}

      {pendingAttachment && (
        <div style={{ marginTop: 12 }}>
          <p>Attachment upload succeeded but backend registration is pending.</p>
          <button type="button" onClick={handleRetryAttachment}>Retry Attachment Registration</button>
        </div>
      )}

      {result && (
        <div style={{ marginTop: 16 }}>
          <p>Incident created: <strong>{result.incident.id}</strong></p>
          <p>
            Attachment status:{" "}
            <strong>
              {result.attachmentRegistered
                ? "Registered"
                : result.attemptedImageUpload
                ? "Pending/Failed"
                : "No image uploaded"}
            </strong>
          </p>
        </div>
      )}
    </section>
  );
}
