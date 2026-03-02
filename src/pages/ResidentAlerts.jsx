import { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { apiRequest } from "../services/api";
import Card from "../components/ui/Card";
import Alert from "../components/ui/Alert";

export default function ResidentAlerts() {
  const { token } = useAuth();
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadAlerts() {
      try {
        const data = await apiRequest("/alerts", {
          headers: { Authorization: `Bearer ${token}` },
        });
        setAlerts(Array.isArray(data) ? data : []);
      } catch (err) {
        setError(err.message || "Failed to load alerts");
      } finally {
        setLoading(false);
      }
    }

    if (token) {
      loadAlerts();
    }
  }, [token]);

  return (
    <section className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold text-neutral-900">Alerts</h1>
        <p className="text-sm text-neutral-600">Official barangay alert feed.</p>
      </div>

      {error && <Alert tone="error">{error}</Alert>}

      {loading ? (
        <Card><p className="text-neutral-600">Loading alerts...</p></Card>
      ) : alerts.length === 0 ? (
        <Card><p className="text-neutral-600">No alerts yet.</p></Card>
      ) : (
        <div className="space-y-3">
          {alerts.map((item) => (
            <Card key={item.id}>
              <div className="flex flex-wrap items-start justify-between gap-2">
                <h3 className="text-lg font-semibold text-neutral-900">{item.title}</h3>
                <span className="rounded-full bg-neutral-100 px-2.5 py-1 text-xs font-semibold uppercase tracking-wide text-neutral-700">
                  {item.type}
                </span>
              </div>
              <p className="mt-2 text-sm text-neutral-700">{item.message}</p>
              <p className="mt-2 text-xs text-neutral-500">{new Date(item.created_at).toLocaleString()}</p>
            </Card>
          ))}
        </div>
      )}
    </section>
  );
}
