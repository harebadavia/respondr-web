import { useEffect, useMemo, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { apiAuthRequest } from "../services/api";
import Card from "../components/ui/Card";
import Alert from "../components/ui/Alert";
import RolePageHeader from "../components/ui/RolePageHeader";
import Button from "../components/ui/Button";

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
      <RolePageHeader
        role="resident"
        title="Alerts"
        subtitle="Official barangay alert feed."
        right={(
          <div className="flex items-center gap-2">
            <span className="rounded-full bg-[#EAF3DE] px-2.5 py-1 text-xs font-bold text-[#3B6D11]">{alerts.length}</span>
            <Button type="button" variant="secondary" onClick={() => loadAlerts("refresh")} disabled={refreshing}>
              {refreshing ? "Refreshing..." : "Refresh"}
            </Button>
          </div>
        )}
      />

      <div className="flex items-center gap-2 rounded-2xl border border-[var(--color-border-tertiary)] bg-white px-4 py-2 shadow-[0_4px_14px_rgba(15,23,42,0.06)]">
        <span className="text-[var(--color-text-tertiary)]">🔍</span>
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
