import { useCallback, useEffect, useMemo, useState } from "react";
import { apiAuthRequest } from "../services/api";
import Button from "../components/ui/Button";
import Card from "../components/ui/Card";
import ToastStack from "../components/ui/ToastStack";
import RolePageHeader from "../components/ui/RolePageHeader";
import { ListToolbar, Pagination } from "../components/ui/ListControls";
import { paginateItems } from "../components/ui/listControlUtils";
import { FaMobileScreenButton } from "react-icons/fa6";

const DEFAULT_SUMMARY = {
  total: 0,
  enabled: 0,
  disabled: 0,
  active_resident_recipients: 0,
  expo: 0,
  fcm: 0,
  active_users: 0,
};

const thStyle = {
  padding: "0 12px 10px 0",
  fontSize: 11,
  fontWeight: 600,
  color: "var(--color-text-tertiary)",
  textAlign: "left",
  textTransform: "uppercase",
  letterSpacing: "0.06em",
  borderBottom: "0.5px solid var(--color-border-tertiary)",
  whiteSpace: "nowrap",
};

const tdStyle = {
  padding: "11px 12px 11px 0",
  fontSize: 13,
  color: "var(--color-text-primary)",
  borderBottom: "0.5px solid var(--color-border-tertiary)",
  verticalAlign: "middle",
};

function formatDate(value) {
  if (!value) return "Unknown";
  return new Date(value).toLocaleString();
}

function userName(device) {
  const name = `${device.user_first_name || ""} ${device.user_last_name || ""}`.trim();
  return name || "Unknown user";
}

function tokenBadgeClass(value) {
  if (value === "expo") return "bg-[#E6F1FB] text-[#185FA5]";
  if (value === "fcm") return "bg-[#EAF3DE] text-[#3B6D11]";
  return "bg-neutral-100 text-neutral-700";
}

function statusBadgeClass(enabled) {
  return enabled ? "bg-[#EAF3DE] text-[#3B6D11]" : "bg-[#F1EFE8] text-[#5F5E5A]";
}

function userStatusBadgeClass(active) {
  return active ? "bg-[#E6F1FB] text-[#185FA5]" : "bg-[#F1EFE8] text-[#5F5E5A]";
}

function prettyValue(value) {
  return String(value || "unknown").replace("_", " ");
}

export default function AdminDevices() {
  const [devices, setDevices] = useState([]);
  const [summary, setSummary] = useState(DEFAULT_SUMMARY);
  const [searchTerm, setSearchTerm] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [platformFilter, setPlatformFilter] = useState("all");
  const [roleFilter, setRoleFilter] = useState("all");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [loading, setLoading] = useState(true);
  const [busyDeviceId, setBusyDeviceId] = useState(null);
  const [toasts, setToasts] = useState([]);

  const pushToast = useCallback((tone, message, durationMs = 4500) => {
    setToasts((prev) => [
      ...prev,
      { id: `${Date.now()}-${Math.random().toString(36).slice(2)}`, tone, message, durationMs },
    ]);
  }, []);

  const dismissToast = useCallback((id) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  }, []);

  const loadDevices = useCallback(async () => {
    setLoading(true);

    try {
      const data = await apiAuthRequest("/devices?limit=500");
      setDevices(Array.isArray(data?.devices) ? data.devices : []);
      setSummary(data?.summary || DEFAULT_SUMMARY);
    } catch (err) {
      pushToast("error", err.message || "Failed to load registered devices");
    } finally {
      setLoading(false);
    }
  }, [pushToast]);

  useEffect(() => {
    loadDevices();
  }, [loadDevices]);

  const platformOptions = useMemo(() => {
    const values = Array.from(new Set(devices.map((device) => String(device.platform || "unknown").toLowerCase()))).sort();
    return [
      { value: "all", label: "All platforms" },
      ...values.map((value) => ({ value, label: prettyValue(value) })),
    ];
  }, [devices]);

  const roleOptions = useMemo(() => {
    const values = Array.from(new Set(devices.map((device) => String(device.user_role || "unknown").toLowerCase()))).sort();
    return [
      { value: "all", label: "All roles" },
      ...values.map((value) => ({ value, label: prettyValue(value) })),
    ];
  }, [devices]);

  const filteredDevices = useMemo(() => {
    const query = searchTerm.trim().toLowerCase();
    return devices.filter((device) => {
      const tokenType = String(device.token_type || "unknown").toLowerCase();
      const platform = String(device.platform || "unknown").toLowerCase();
      const role = String(device.user_role || "unknown").toLowerCase();
      if (typeFilter !== "all" && tokenType !== typeFilter) return false;
      if (platformFilter !== "all" && platform !== platformFilter) return false;
      if (roleFilter !== "all" && role !== roleFilter) return false;
      if (statusFilter === "enabled" && !device.is_enabled) return false;
      if (statusFilter === "disabled" && device.is_enabled) return false;
      if (!query) return true;

      return [
        userName(device),
        device.user_email,
        device.user_role,
        device.platform,
        device.user_is_active ? "active" : "inactive",
        device.is_enabled ? "enabled" : "disabled",
        device.token_preview,
        device.token_type,
        device.last_seen_at ? new Date(device.last_seen_at).toLocaleString() : "",
        device.created_at ? new Date(device.created_at).toLocaleString() : "",
      ].join(" ").toLowerCase().includes(query);
    });
  }, [devices, platformFilter, roleFilter, searchTerm, statusFilter, typeFilter]);

  useEffect(() => {
    setPage(1);
  }, [searchTerm, typeFilter, statusFilter, platformFilter, roleFilter, pageSize]);

  const pagination = paginateItems(filteredDevices, page, pageSize);

  const handleToggleDevice = async (device) => {
    setBusyDeviceId(device.id);
    const nextEnabled = !device.is_enabled;

    try {
      await apiAuthRequest(`/devices/${device.id}`, {
        method: "PUT",
        body: JSON.stringify({ is_enabled: nextEnabled }),
      });
      pushToast("success", nextEnabled ? "Device enabled for alerts." : "Device disabled for alerts.");
      await loadDevices();
    } catch (err) {
      pushToast("error", err.message || "Failed to update device");
    } finally {
      setBusyDeviceId(null);
    }
  };

  return (
    <section className="space-y-4">
      <ToastStack toasts={toasts} onDismiss={dismissToast} />
      <RolePageHeader
        title="Registered Devices"
        subtitle="Manage which registered resident devices can receive alert push notifications."
        role="admin"
        icon={FaMobileScreenButton}
      />

      <div className="grid gap-3 md:grid-cols-4">
        <Card>
          <p className="text-xs font-semibold uppercase tracking-wide text-neutral-500">Total</p>
          <p className="mt-2 text-2xl font-semibold text-neutral-900">{summary.total || 0}</p>
        </Card>
        <Card>
          <p className="text-xs font-semibold uppercase tracking-wide text-neutral-500">Enabled</p>
          <p className="mt-2 text-2xl font-semibold text-neutral-900">{summary.enabled || 0}</p>
        </Card>
        <Card>
          <p className="text-xs font-semibold uppercase tracking-wide text-neutral-500">Disabled</p>
          <p className="mt-2 text-2xl font-semibold text-neutral-900">{summary.disabled || 0}</p>
        </Card>
        <Card>
          <p className="text-xs font-semibold uppercase tracking-wide text-neutral-500">Recipients</p>
          <p className="mt-2 text-2xl font-semibold text-neutral-900">{summary.active_resident_recipients || 0}</p>
        </Card>
      </div>

      <ListToolbar
        searchValue={searchTerm}
        onSearchChange={setSearchTerm}
        searchPlaceholder="Search devices"
        filters={[
          {
            id: "type",
            label: "Type",
            value: typeFilter,
            onChange: setTypeFilter,
            options: [
              { value: "all", label: "All types" },
              { value: "expo", label: "Expo" },
              { value: "fcm", label: "FCM" },
            ],
          },
          {
            id: "status",
            label: "Device status",
            value: statusFilter,
            onChange: setStatusFilter,
            options: [
              { value: "all", label: "All statuses" },
              { value: "enabled", label: "Enabled" },
              { value: "disabled", label: "Disabled" },
            ],
          },
          {
            id: "platform",
            label: "Platform",
            value: platformFilter,
            onChange: setPlatformFilter,
            options: platformOptions,
          },
          {
            id: "role",
            label: "Role",
            value: roleFilter,
            onChange: setRoleFilter,
            options: roleOptions,
          },
        ]}
        pageSize={pageSize}
        onPageSizeChange={setPageSize}
      />

      {loading ? (
        <Card><p className="text-neutral-600">Loading registered devices...</p></Card>
      ) : devices.length === 0 ? (
        <Card><p className="text-neutral-600">No devices registered yet.</p></Card>
      ) : filteredDevices.length === 0 ? (
        <Card><p className="text-neutral-600">No devices match your search.</p></Card>
      ) : (
        <Card>
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr>
                  <th style={thStyle}>User</th>
                  <th style={thStyle}>Role</th>
                  <th style={thStyle}>Token</th>
                  <th style={thStyle}>Type</th>
                  <th style={thStyle}>Platform</th>
                  <th style={thStyle}>Last Seen</th>
                  <th style={thStyle}>Device</th>
                  <th style={thStyle}>User</th>
                  <th style={thStyle}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {pagination.pageItems.map((device) => (
                  <tr key={device.id}>
                    <td style={tdStyle}>
                      <div className="font-medium text-neutral-900">{userName(device)}</div>
                      <div className="text-xs text-neutral-500">{device.user_email || "No email"}</div>
                    </td>
                    <td style={tdStyle}>{device.user_role || "unknown"}</td>
                    <td style={tdStyle}>
                      <code className="rounded bg-neutral-100 px-2 py-1 text-xs text-neutral-700">
                        {device.token_preview || "Unavailable"}
                      </code>
                    </td>
                    <td style={tdStyle}>
                      <span className={`rounded-full px-2.5 py-1 text-xs font-semibold uppercase ${tokenBadgeClass(device.token_type)}`}>
                        {device.token_type || "unknown"}
                      </span>
                    </td>
                    <td style={tdStyle}>{prettyValue(device.platform)}</td>
                    <td style={tdStyle}>{formatDate(device.last_seen_at || device.created_at)}</td>
                    <td style={tdStyle}>
                      <span className={`rounded-full px-2.5 py-1 text-xs font-semibold uppercase ${statusBadgeClass(device.is_enabled)}`}>
                        {device.is_enabled ? "Enabled" : "Disabled"}
                      </span>
                    </td>
                    <td style={tdStyle}>
                      <span className={`rounded-full px-2.5 py-1 text-xs font-semibold uppercase ${userStatusBadgeClass(device.user_is_active)}`}>
                        {device.user_is_active ? "Active" : "Inactive"}
                      </span>
                    </td>
                    <td style={tdStyle}>
                      <Button
                        type="button"
                        variant={device.is_enabled ? "secondary" : "primary"}
                        disabled={busyDeviceId === device.id}
                        onClick={() => handleToggleDevice(device)}
                      >
                        {busyDeviceId === device.id ? "Saving..." : device.is_enabled ? "Disable" : "Enable"}
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {!loading && filteredDevices.length > 0 && (
        <Pagination
          page={pagination.safePage}
          totalPages={pagination.totalPages}
          totalItems={filteredDevices.length}
          start={pagination.start}
          end={pagination.end}
          onPageChange={setPage}
        />
      )}
    </section>
  );
}
