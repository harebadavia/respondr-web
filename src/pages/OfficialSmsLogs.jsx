import { useEffect, useMemo, useState } from "react";
import { apiAuthRequest } from "../services/api";
import Card from "../components/ui/Card";
import Alert from "../components/ui/Alert";

const LIMIT_OPTIONS = [25, 50, 100, 200];

export default function OfficialSmsLogs() {
  const [logs, setLogs] = useState([]);
  const [status, setStatus] = useState("");
  const [limit, setLimit] = useState(50);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const query = useMemo(() => {
    const params = new URLSearchParams();
    params.set("limit", String(limit));
    if (status) params.set("status", status);
    return params.toString();
  }, [limit, status]);

  useEffect(() => {
    let isMounted = true;

    async function fetchSmsLogs() {
      setLoading(true);
      setError("");

      try {
        const data = await apiAuthRequest(`/sms/logs?${query}`);
        if (!isMounted) return;
        setLogs(Array.isArray(data) ? data : []);
      } catch (err) {
        if (!isMounted) return;
        setError(err.message || "Failed to load SMS logs");
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    fetchSmsLogs();

    return () => {
      isMounted = false;
    };
  }, [query]);

  return (
    <section className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold text-neutral-900">SMS Logs</h1>
        <p className="text-sm text-neutral-600">Operational SMS audit view for alerts.</p>
      </div>

      {error && <Alert tone="error">{error}</Alert>}

      <Card>
        <div className="grid gap-3 md:grid-cols-2">
          <div>
            <label>Status</label>
            <select
              value={status}
              onChange={(event) => setStatus(event.target.value)}
              className="w-full rounded-md border border-neutral-300 bg-white px-3 py-2 text-sm"
            >
              <option value="">All</option>
              <option value="disabled">Disabled</option>
              <option value="queued">Queued</option>
              <option value="sent">Sent</option>
              <option value="failed">Failed</option>
            </select>
          </div>

          <div>
            <label>Limit</label>
            <select
              value={limit}
              onChange={(event) => setLimit(Number(event.target.value))}
              className="w-full rounded-md border border-neutral-300 bg-white px-3 py-2 text-sm"
            >
              {LIMIT_OPTIONS.map((size) => (
                <option key={size} value={size}>{size}</option>
              ))}
            </select>
          </div>
        </div>
      </Card>

      {loading ? (
        <Card><p className="text-neutral-600">Loading SMS logs...</p></Card>
      ) : logs.length === 0 ? (
        <Card><p className="text-neutral-600">No SMS logs yet.</p></Card>
      ) : (
        <Card>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-neutral-200 text-sm">
              <thead>
                <tr className="text-left text-neutral-600">
                  <th className="px-3 py-2 font-semibold">Sent At</th>
                  <th className="px-3 py-2 font-semibold">Alert</th>
                  <th className="px-3 py-2 font-semibold">Recipient</th>
                  <th className="px-3 py-2 font-semibold">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100">
                {logs.map((log) => (
                  <tr key={log.id}>
                    <td className="px-3 py-2 text-neutral-700">{new Date(log.sent_at).toLocaleString()}</td>
                    <td className="px-3 py-2 text-neutral-700">{log.alert_title || "N/A"}</td>
                    <td className="px-3 py-2 text-neutral-700">{log.phone_number}</td>
                    <td className="px-3 py-2">
                      <span className="rounded-full bg-neutral-100 px-2.5 py-1 text-xs font-semibold uppercase tracking-wide text-neutral-700">
                        {log.status || "unknown"}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </section>
  );
}
