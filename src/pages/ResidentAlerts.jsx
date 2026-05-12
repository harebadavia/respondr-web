import { useEffect, useMemo, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { apiAuthRequest } from "../services/api";
import Card from "../components/ui/Card";
import Alert from "../components/ui/Alert";
import RolePageHeader from "../components/ui/RolePageHeader";
import Button from "../components/ui/Button";
import { ListToolbar, Pagination } from "../components/ui/ListControls";
import { DATE_FILTER_OPTIONS, matchesDateFilter, paginateItems } from "../components/ui/listControlUtils";
import { FaBell } from "react-icons/fa6";

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
  const [typeFilter, setTypeFilter] = useState("all");
  const [dateFilter, setDateFilter] = useState("all");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

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
    return alerts.filter((item) => {
      const type = String(item.type || "").toLowerCase();
      if (typeFilter !== "all" && type !== typeFilter) return false;
      if (!matchesDateFilter(item.created_at, dateFilter)) return false;
      if (!q) return true;
      return item.title?.toLowerCase().includes(q) ||
        item.message?.toLowerCase().includes(q) ||
        type.includes(q);
    });
  }, [alerts, dateFilter, query, typeFilter]);

  useEffect(() => {
    setPage(1);
  }, [query, typeFilter, dateFilter, pageSize]);

  const alertTypeOptions = useMemo(() => {
    const types = Array.from(new Set(alerts.map((item) => String(item.type || "").toLowerCase()).filter(Boolean))).sort();
    return [{ value: "all", label: "All types" }, ...types.map((type) => ({ value: type, label: type }))];
  }, [alerts]);

  const pagination = paginateItems(filteredAlerts, page, pageSize);

  return (
    <section className="space-y-4">
      <RolePageHeader
        role="resident"
        title="Alerts"
        subtitle="Official barangay alert feed."
        icon={FaBell}
        right={(
          <div className="flex items-center gap-2">
            <span className="rounded-full bg-[#EAF3DE] px-2.5 py-1 text-xs font-bold text-[#3B6D11]">{alerts.length}</span>
            <Button type="button" variant="secondary" onClick={() => loadAlerts("refresh")} disabled={refreshing}>
              {refreshing ? "Refreshing..." : "Refresh"}
            </Button>
          </div>
        )}
      />

      <ListToolbar
        searchValue={query}
        onSearchChange={setQuery}
        searchPlaceholder="Search alerts"
        filters={[
          { id: "type", label: "Type", value: typeFilter, onChange: setTypeFilter, options: alertTypeOptions },
          { id: "date", label: "Date", value: dateFilter, onChange: setDateFilter, options: DATE_FILTER_OPTIONS },
        ]}
        pageSize={pageSize}
        onPageSizeChange={setPageSize}
      />

      {error && <Alert tone="error">{error}</Alert>}

      {loading ? (
        <Card><p className="text-neutral-600">Loading alerts...</p></Card>
      ) : filteredAlerts.length === 0 ? (
        <Card>
          <p className="text-neutral-600">No alerts yet.</p>
        </Card>
      ) : (
        <div className="space-y-4">
          {pagination.pageItems.map((item) => {
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

      {!loading && filteredAlerts.length > 0 && (
        <Pagination
          page={pagination.safePage}
          totalPages={pagination.totalPages}
          totalItems={filteredAlerts.length}
          start={pagination.start}
          end={pagination.end}
          onPageChange={setPage}
        />
      )}
    </section>
  );
}
