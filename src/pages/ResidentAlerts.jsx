import { useEffect, useMemo, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { apiAuthRequest } from "../services/api";
import Card from "../components/ui/Card";
import Alert from "../components/ui/Alert";

const TYPE_COLORS = {
  emergency: "bg-red-500",
  warning: "bg-amber-500",
  info: "bg-blue-500",
  update: "bg-teal-500",
};

const TYPE_TEXT = {
  emergency: "text-red-700 bg-red-100",
  warning: "text-amber-700 bg-amber-100",
  info: "text-blue-700 bg-blue-100",
  update: "text-teal-700 bg-teal-100",
};

export default function ResidentAlerts() {
  const { isAuthenticated } = useAuth();
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");
  const [query, setQuery] = useState("");

  const loadAlerts = async (mode = "initial") => {
    if (mode === "initial") setLoading(true);
    if (mode === "refresh") setRefreshing(true);
    setError("");
    try {
      const data = await apiAuthRequest("/alerts?limit=50");
      setAlerts(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err.message || "Failed to load alerts");
    } finally {
      if (mode === "initial") setLoading(false);
      if (mode === "refresh") setRefreshing(false);
    }
  };

  useEffect(() => {
    if (isAuthenticated) loadAlerts("initial");
  }, [isAuthenticated]);

  const filteredAlerts = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return alerts;
    return alerts.filter((item) =>
      item.title?.toLowerCase().includes(q) ||
      item.message?.toLowerCase().includes(q) ||
      String(item.type || "").toLowerCase().includes(q)
    );
  }, [alerts, query]);

  return (
    <section className="space-y-4">
      <div className="rounded-2xl bg-brand-800 px-5 py-5 text-white shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold">Alerts</h1>
            <span className="rounded-full border border-white/25 bg-white/15 px-2 py-0.5 text-xs font-bold">
              {alerts.length}
            </span>
          </div>
          <button
            type="button"
            onClick={() => loadAlerts("refresh")}
            disabled={refreshing}
            className="rounded-full bg-white/15 px-4 py-2 text-sm font-semibold text-white transition hover:bg-white/25 disabled:opacity-70"
          >
            {refreshing ? "Refreshing..." : "Refresh"}
          </button>
        </div>
        <p className="mt-1 text-sm text-white/80">Official barangay alert feed.</p>
      </div>

      <div className="flex items-center gap-2 rounded-full border border-neutral-200 bg-white px-4 py-2 shadow-sm">
        <span className="text-neutral-400">🔍</span>
        <input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search alerts"
          className="border-0 p-0 text-sm focus:ring-0"
        />
      </div>

      {error && <Alert tone="error">{error}</Alert>}

      {loading ? (
        <Card><p className="text-neutral-600">Loading alerts...</p></Card>
      ) : filteredAlerts.length === 0 ? (
        <Card>
          <p className="text-neutral-600">No alerts yet.</p>
        </Card>
      ) : (
        <div className="space-y-3">
          {filteredAlerts.map((item) => {
            const toneKey = String(item.type || "").toLowerCase();
            const stripClass = TYPE_COLORS[toneKey] || "bg-neutral-400";
            const pillClass = TYPE_TEXT[toneKey] || "text-neutral-700 bg-neutral-100";

            return (
              <Card key={item.id} className="overflow-hidden p-0">
                <div className="flex">
                  <div className={`w-1 ${stripClass}`} />
                  <div className="flex-1 p-4">
                    <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
                      <span className={`rounded-full px-2.5 py-1 text-xs font-semibold uppercase tracking-wide ${pillClass}`}>
                        {item.type}
                      </span>
                      <p className="text-xs text-neutral-500">{new Date(item.created_at).toLocaleString()}</p>
                    </div>
                    <h3 className="text-lg font-semibold text-neutral-900">{item.title}</h3>
                    <p className="mt-2 text-sm text-neutral-700">{item.message}</p>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </section>
  );
}
