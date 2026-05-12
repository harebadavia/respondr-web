import { useEffect, useMemo, useState } from "react";
import { apiAuthRequest } from "../services/api";
import Card from "../components/ui/Card";
import Alert from "../components/ui/Alert";
import RolePageHeader from "../components/ui/RolePageHeader";
import { ListToolbar, Pagination } from "../components/ui/ListControls";
import { DATE_FILTER_OPTIONS, matchesDateFilter, paginateItems } from "../components/ui/listControlUtils";
import { FaMessage } from "react-icons/fa6";

const LIMIT_OPTIONS = [25, 50, 100, 200];

export default function OfficialSmsLogs() {
  const [logs, setLogs] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [dateFilter, setDateFilter] = useState("all");
  const [fetchLimit, setFetchLimit] = useState(100);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const requestQuery = useMemo(() => {
    const params = new URLSearchParams();
    params.set("limit", String(fetchLimit));
    if (statusFilter !== "all") params.set("status", statusFilter);
    return params.toString();
  }, [fetchLimit, statusFilter]);

  const filteredLogs = useMemo(() => {
    const query = searchTerm.trim().toLowerCase();
    return logs.filter((log) => {
      if (!matchesDateFilter(log.sent_at, dateFilter)) return false;
      if (!query) return true;
      return [
        log.alert_title,
        log.phone_number,
        log.status,
        log.provider_status,
        log.failure_reason,
        log.sent_at ? new Date(log.sent_at).toLocaleString() : "",
      ].join(" ").toLowerCase().includes(query);
    });
  }, [dateFilter, logs, searchTerm]);

  useEffect(() => {
    setPage(1);
  }, [searchTerm, statusFilter, dateFilter, fetchLimit, pageSize]);

  const pagination = paginateItems(filteredLogs, page, pageSize);

  useEffect(() => {
    let isMounted = true;

    async function fetchSmsLogs() {
      setLoading(true);
      setError("");

      try {
        const data = await apiAuthRequest(`/sms/logs?${requestQuery}`);
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
  }, [requestQuery]);

  return (
    <section className="space-y-4">
      <RolePageHeader
        role="official"
        title="SMS Logs"
        subtitle="Operational SMS audit view for alerts."
        icon={FaMessage}
      />

      {error && <Alert tone="error">{error}</Alert>}

      <ListToolbar
        searchValue={searchTerm}
        onSearchChange={setSearchTerm}
        searchPlaceholder="Search SMS logs"
        filters={[
          {
            id: "status",
            label: "Status",
            value: statusFilter,
            onChange: setStatusFilter,
            options: [
              { value: "all", label: "All statuses" },
              { value: "disabled", label: "Disabled" },
              { value: "queued", label: "Queued" },
              { value: "pending", label: "Pending" },
              { value: "sent", label: "Sent" },
              { value: "failed", label: "Failed" },
            ],
          },
          { id: "date", label: "Date", value: dateFilter, onChange: setDateFilter, options: DATE_FILTER_OPTIONS },
          {
            id: "fetchLimit",
            label: "Loaded",
            value: String(fetchLimit),
            onChange: (value) => setFetchLimit(Number(value)),
            options: LIMIT_OPTIONS.map((size) => ({ value: String(size), label: String(size) })),
          },
        ]}
        pageSize={pageSize}
        onPageSizeChange={setPageSize}
      />

      {loading ? (
        <Card><p className="text-neutral-600">Loading SMS logs...</p></Card>
      ) : logs.length === 0 ? (
        <Card><p className="text-neutral-600">No SMS logs yet.</p></Card>
      ) : filteredLogs.length === 0 ? (
        <Card><p className="text-neutral-600">No SMS logs match your filters.</p></Card>
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
                  <th className="px-3 py-2 font-semibold">Provider</th>
                  <th className="px-3 py-2 font-semibold">Failure</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100">
                {pagination.pageItems.map((log) => (
                  <tr key={log.id}>
                    <td className="px-3 py-2 text-neutral-700">{new Date(log.sent_at).toLocaleString()}</td>
                    <td className="px-3 py-2 text-neutral-700">{log.alert_title || "N/A"}</td>
                    <td className="px-3 py-2 text-neutral-700">{log.phone_number}</td>
                    <td className="px-3 py-2">
                      <span className="rounded-full bg-neutral-100 px-2.5 py-1 text-xs font-semibold uppercase tracking-wide text-neutral-700">
                        {log.status || "unknown"}
                      </span>
                    </td>
                    <td className="px-3 py-2 text-neutral-700">{log.provider_status || log.provider || "N/A"}</td>
                    <td className="px-3 py-2 text-neutral-700">{log.failure_reason || "N/A"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {!loading && filteredLogs.length > 0 && (
        <Pagination
          page={pagination.safePage}
          totalPages={pagination.totalPages}
          totalItems={filteredLogs.length}
          start={pagination.start}
          end={pagination.end}
          onPageChange={setPage}
        />
      )}
    </section>
  );
}
