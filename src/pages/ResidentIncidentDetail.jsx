import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { getDownloadURL, ref } from "firebase/storage";
import { storage } from "../firebase";
import { useAuth } from "../context/AuthContext";
import { apiRequest } from "../services/api";

export default function ResidentIncidentDetail() {
  const { id } = useParams();
  const { token } = useAuth();
  const [incident, setIncident] = useState(null);
  const [imageUrl, setImageUrl] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadIncident() {
      try {
        const data = await apiRequest(`/incidents/${id}`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        setIncident(data);

        const firstAttachment = Array.isArray(data.attachments) ? data.attachments[0] : null;
        if (firstAttachment?.storage_path) {
          const downloadUrl = await getDownloadURL(ref(storage, firstAttachment.storage_path));
          setImageUrl(downloadUrl);
        }
      } catch (err) {
        setError(err.message || "Failed to load incident");
      } finally {
        setLoading(false);
      }
    }

    if (token && id) {
      loadIncident();
    }
  }, [id, token]);

  if (loading) return <p>Loading incident...</p>;
  if (error) return <p style={{ color: "red" }}>{error}</p>;
  if (!incident) return <p>Incident not found.</p>;

  return (
    <section>
      <h1>{incident.title}</h1>
      <p>Status: <strong>{incident.status}</strong></p>
      <p>{incident.description}</p>
      <p>Type: {incident.incident_type || "N/A"}</p>
      <p>
        Coordinates: {incident.latitude}, {incident.longitude}
      </p>

      <h3>Attachment</h3>
      {imageUrl ? (
        <img src={imageUrl} alt="Incident attachment" style={{ maxWidth: 420, width: "100%", borderRadius: 8 }} />
      ) : (
        <p>No attachment</p>
      )}
    </section>
  );
}
