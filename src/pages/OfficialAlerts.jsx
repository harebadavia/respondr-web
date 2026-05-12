import { useEffect, useMemo, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { apiAuthRequest } from "../services/api";
import Card from "../components/ui/Card";
import Alert from "../components/ui/Alert";
import Button from "../components/ui/Button";
import Input from "../components/ui/Input";
import Textarea from "../components/ui/Textarea";
import RolePageHeader from "../components/ui/RolePageHeader";
import Modal from "../components/ui/Modal";
import { ListToolbar, Pagination } from "../components/ui/ListControls";
import { DATE_FILTER_OPTIONS, matchesDateFilter, paginateItems } from "../components/ui/listControlUtils";
import { FaBell } from "react-icons/fa6";

const INITIAL_FORM = {
  title: "",
  message: "",
  type: "incident",
  send_push: "true",
  send_sms: "false",
};

function formatSmsSummary(summary) {
  if (!summary) return "";
  const filtered = Number(summary.filtered_by_allowlist || 0);
  const parts = [
    `enabled ${summary.enabled ? "yes" : "no"}`,
    `attempted ${summary.attempted ? "yes" : "no"}`,
    `total ${summary.total ?? 0}`,
    `queued/sent ${summary.queued_or_sent ?? 0}`,
    `failed ${summary.failed ?? 0}`,
  ];

  if (filtered > 0) parts.push(`allowlist-filtered ${filtered}`);
  if (summary.provider) parts.push(`provider ${summary.provider}`);
  return parts.join(", ");
}

export default function OfficialAlerts() {
  const { isAuthenticated } = useAuth();

  const [form, setForm] = useState(INITIAL_FORM);
  const [alerts, setAlerts] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [dateFilter, setDateFilter] = useState("all");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [createOpen, setCreateOpen] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [pushSummary, setPushSummary] = useState(null);
  const [smsSummary, setSmsSummary] = useState(null);

  const loadAlerts = async () => {
    setLoading(true);
    setError("");

    try {
      const data = await apiAuthRequest("/alerts");
      setAlerts(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err.message || "Failed to load alerts");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!isAuthenticated) return;
    loadAlerts();
  }, [isAuthenticated]);

  const filteredAlerts = useMemo(() => {
    const query = searchTerm.trim().toLowerCase();
    return alerts.filter((item) => {
      if (typeFilter !== "all" && String(item.type || "").toLowerCase() !== typeFilter) return false;
      if (!matchesDateFilter(item.created_at, dateFilter)) return false;
      if (!query) return true;
      return [
        item.title,
        item.message,
        item.type,
        item.created_at ? new Date(item.created_at).toLocaleString() : "",
      ].join(" ").toLowerCase().includes(query);
    });
  }, [alerts, dateFilter, searchTerm, typeFilter]);

  useEffect(() => {
    setPage(1);
  }, [searchTerm, typeFilter, dateFilter, pageSize]);

  const alertTypeOptions = useMemo(() => {
    const types = Array.from(new Set(alerts.map((item) => String(item.type || "").toLowerCase()).filter(Boolean))).sort();
    return [{ value: "all", label: "All types" }, ...types.map((type) => ({ value: type, label: type }))];
  }, [alerts]);

  const pagination = paginateItems(filteredAlerts, page, pageSize);

  const onChange = (event) => {
    setForm((prev) => ({
      ...prev,
      [event.target.name]: event.target.value,
    }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSubmitting(true);
    setError("");
    setMessage("");
    setPushSummary(null);
    setSmsSummary(null);

    try {
      const payload = {
        title: form.title.trim(),
        message: form.message.trim(),
        type: form.type,
        send_push: form.send_push === "true",
        send_sms: form.send_sms === "true",
      };

      if (!payload.title || !payload.message) {
        throw new Error("Title and message are required.");
      }

      const created = await apiAuthRequest("/alerts", {
        method: "POST",
        body: JSON.stringify(payload),
      });

      setMessage("Alert sent successfully.");
      setPushSummary(created.push_summary || null);
      setSmsSummary(created.sms_summary || null);
      setForm(INITIAL_FORM);
      setCreateOpen(false);
      await loadAlerts();
    } catch (err) {
      setError(err.message || "Failed to send alert");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <section className="space-y-4">
      <RolePageHeader
        role="official"
        title="Alerts"
        subtitle="Create and broadcast barangay alerts."
        icon={FaBell}
        right={(
          <Button type="button" onClick={() => setCreateOpen(true)}>
            Create
          </Button>
        )}
      />

      {error && <Alert tone="error">{error}</Alert>}
      {message && <Alert tone="success">{message}</Alert>}

      {pushSummary && (
        <Alert tone="info">
          Push summary: total {pushSummary.total}, sent {pushSummary.sent}, failed {pushSummary.failed}
        </Alert>
      )}

      {smsSummary && (
        <Alert tone="info">
          SMS summary: {formatSmsSummary(smsSummary)}
        </Alert>
      )}

      <ListToolbar
        searchValue={searchTerm}
        onSearchChange={setSearchTerm}
        searchPlaceholder="Search alerts"
        filters={[
          { id: "type", label: "Type", value: typeFilter, onChange: setTypeFilter, options: alertTypeOptions },
          { id: "date", label: "Date", value: dateFilter, onChange: setDateFilter, options: DATE_FILTER_OPTIONS },
        ]}
        pageSize={pageSize}
        onPageSizeChange={setPageSize}
      />

      {loading ? (
        <Card><p className="text-neutral-600">Loading alerts...</p></Card>
      ) : alerts.length === 0 ? (
        <Card><p className="text-neutral-600">No alerts yet.</p></Card>
      ) : filteredAlerts.length === 0 ? (
        <Card><p className="text-neutral-600">No alerts match your search.</p></Card>
      ) : (
        <div className="space-y-3">
          {pagination.pageItems.map((item) => (
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

      <Modal open={createOpen} onClose={() => setCreateOpen(false)} title="Create Alert">
        <form onSubmit={handleSubmit} className="space-y-3">
          <Input name="title" label="Title" value={form.title} onChange={onChange} required />
          <Textarea name="message" label="Message" rows={4} value={form.message} onChange={onChange} required />

          <div className="grid gap-3 md:grid-cols-3">
            <div>
              <label>Type</label>
              <select name="type" value={form.type} onChange={onChange} className="w-full rounded-md border border-neutral-300 bg-white px-3 py-2 text-sm">
                <option value="incident">Incident</option>
                <option value="announcement">Announcement</option>
                <option value="emergency">Emergency</option>
              </select>
            </div>

            <div>
              <label>Send push</label>
              <select name="send_push" value={form.send_push} onChange={onChange} className="w-full rounded-md border border-neutral-300 bg-white px-3 py-2 text-sm">
                <option value="true">Yes</option>
                <option value="false">No</option>
              </select>
            </div>

            <div>
              <label>Send SMS</label>
              <select name="send_sms" value={form.send_sms} onChange={onChange} className="w-full rounded-md border border-neutral-300 bg-white px-3 py-2 text-sm">
                <option value="false">No</option>
                <option value="true">Yes</option>
              </select>
            </div>
          </div>

          <div className="flex gap-2">
            <Button type="submit" disabled={submitting}>{submitting ? "Sending..." : "Send Alert"}</Button>
            <Button type="button" variant="secondary" onClick={() => setCreateOpen(false)}>Cancel</Button>
          </div>
        </form>
      </Modal>
    </section>
  );
}
