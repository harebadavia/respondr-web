import { useEffect, useMemo, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { apiAuthRequest } from "../services/api";
import Card from "../components/ui/Card";
import Alert from "../components/ui/Alert";

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
      <div className="rounded-2xl bg-brand-800 px-5 py-5 text-white shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold">Announcements</h1>
            <span className="rounded-full border border-white/25 bg-white/15 px-2 py-0.5 text-xs font-bold">
              {announcements.length}
            </span>
          </div>
          <button
            type="button"
            onClick={() => loadAnnouncements("refresh")}
            disabled={refreshing}
            className="rounded-full bg-white/15 px-4 py-2 text-sm font-semibold text-white transition hover:bg-white/25 disabled:opacity-70"
          >
            {refreshing ? "Refreshing..." : "Refresh"}
          </button>
        </div>
        <p className="mt-1 text-sm text-white/80">Latest barangay announcements.</p>
      </div>

      <div className="flex items-center gap-2 rounded-full border border-neutral-200 bg-white px-4 py-2 shadow-sm">
        <span className="text-neutral-400">🔍</span>
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
