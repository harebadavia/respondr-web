import { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { apiAuthRequest } from "../services/api";
import Card from "../components/ui/Card";
import Alert from "../components/ui/Alert";

export default function ResidentAnnouncements() {
  const { isAuthenticated } = useAuth();
  const [announcements, setAnnouncements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadAnnouncements() {
      try {
        const data = await apiAuthRequest("/announcements");
        setAnnouncements(Array.isArray(data) ? data : []);
      } catch (err) {
        setError(err.message || "Failed to load announcements");
      } finally {
        setLoading(false);
      }
    }

    if (isAuthenticated) {
      loadAnnouncements();
    }
  }, [isAuthenticated]);

  return (
    <section className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold text-neutral-900">Announcements</h1>
        <p className="text-sm text-neutral-600">Latest barangay announcements.</p>
      </div>

      {error && <Alert tone="error">{error}</Alert>}

      {loading ? (
        <Card><p className="text-neutral-600">Loading announcements...</p></Card>
      ) : announcements.length === 0 ? (
        <Card><p className="text-neutral-600">No announcements yet.</p></Card>
      ) : (
        <div className="space-y-3">
          {announcements.map((item) => (
            <Card key={item.id}>
              <h3 className="text-lg font-semibold text-neutral-900">{item.title}</h3>
              <p className="mt-2 text-sm text-neutral-700">{item.content}</p>
              <p className="mt-2 text-xs text-neutral-500">{new Date(item.created_at).toLocaleString()}</p>
            </Card>
          ))}
        </div>
      )}
    </section>
  );
}
