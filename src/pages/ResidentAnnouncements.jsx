import { useEffect, useMemo, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { apiAuthRequest } from "../services/api";
import Card from "../components/ui/Card";
import Alert from "../components/ui/Alert";
import RolePageHeader from "../components/ui/RolePageHeader";
import Button from "../components/ui/Button";

export default function ResidentAnnouncements() {
  const { isAuthenticated } = useAuth();
  const [announcements, setAnnouncements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");
  const [query, setQuery] = useState("");

  const loadAnnouncements = async (mode = "initial") => {
    if (mode === "initial") setLoading(true);
    if (mode === "refresh") setRefreshing(true);
    setError("");
    try {
      const data = await apiAuthRequest("/announcements");
      setAnnouncements(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err.message || "Failed to load announcements");
    } finally {
      if (mode === "initial") setLoading(false);
      if (mode === "refresh") setRefreshing(false);
    }
  };

  useEffect(() => {
    if (isAuthenticated) loadAnnouncements("initial");
  }, [isAuthenticated]);

  const filteredAnnouncements = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return announcements;
    return announcements.filter((item) =>
      item.title?.toLowerCase().includes(q) ||
      item.content?.toLowerCase().includes(q)
    );
  }, [announcements, query]);

  return (
    <section className="space-y-4">
      <RolePageHeader
        role="resident"
        title="Announcements"
        subtitle="Latest barangay announcements."
        right={(
          <div className="flex items-center gap-2">
            <span className="rounded-full bg-[#EAF3DE] px-2.5 py-1 text-xs font-bold text-[#3B6D11]">{announcements.length}</span>
            <Button type="button" variant="secondary" onClick={() => loadAnnouncements("refresh")} disabled={refreshing}>
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
          placeholder="Search announcements"
          className="border-0 p-0 text-sm focus:ring-0"
        />
      </div>

      {error && <Alert tone="error">{error}</Alert>}

      {loading ? (
        <Card><p className="text-neutral-600">Loading announcements...</p></Card>
      ) : filteredAnnouncements.length === 0 ? (
        <Card>
          <p className="text-neutral-600">No announcements yet.</p>
        </Card>
      ) : (
        <div className="space-y-3">
          {filteredAnnouncements.map((item) => (
            <Card key={item.id}>
              <h3 className="text-lg font-semibold text-neutral-900">{item.title}</h3>
              <p className="mt-2 text-sm text-neutral-700">{item.content}</p>
              <p className="mt-3 text-xs text-neutral-500">{new Date(item.created_at).toLocaleString()}</p>
            </Card>
          ))}
        </div>
      )}
    </section>
  );
}
