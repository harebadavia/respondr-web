import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { getDownloadURL, ref } from "firebase/storage";
import { storage } from "../firebase";
import { useAuth } from "../context/AuthContext";
import { apiRequest } from "../services/api";
import Card from "../components/ui/Card";
import StatusChip from "../components/ui/StatusChip";
import Alert from "../components/ui/Alert";
import PageContainer from "../components/ui/PageContainer";

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

  return (
    <PageContainer className="px-0 py-0">
      <Card>
        {loading && <p className="text-neutral-600">Loading incident...</p>}
        {!loading && error && <Alert tone="error">{error}</Alert>}
        {!loading && !error && !incident && <p className="text-neutral-600">Incident not found.</p>}

        {!loading && !error && incident && (
          <>
            <div className="flex flex-wrap items-start justify-between gap-2">
              <h1 className="text-2xl font-bold text-neutral-900">{incident.title}</h1>
              <StatusChip status={incident.status} />
            </div>

            <p className="mt-3 text-neutral-700">{incident.description}</p>
            <div className="mt-3 grid gap-1 text-sm text-neutral-600">
              <p>Type: {incident.incident_type || "N/A"}</p>
              <p>
                Coordinates: {incident.latitude}, {incident.longitude}
              </p>
            </div>

            <h3 className="mt-5 text-lg font-semibold text-neutral-900">Attachment</h3>
            {imageUrl ? (
              <img
                src={imageUrl}
                alt="Incident attachment"
                className="mt-2 w-full max-w-lg rounded-lg border border-neutral-200"
              />
            ) : (
              <p className="mt-2 text-neutral-600">No attachment</p>
            )}
          </>
        )}
      </Card>
    </PageContainer>
  );
}
