import { useEffect, useMemo, useState } from "react";
import { getDownloadURL, ref } from "firebase/storage";
import { storage } from "../firebase";
import { useAuth } from "../context/AuthContext";
import { apiRequest } from "../services/api";
import Card from "../components/ui/Card";
import StatusChip from "../components/ui/StatusChip";
import Alert from "../components/ui/Alert";
import Button from "../components/ui/Button";
import Input from "../components/ui/Input";
import Textarea from "../components/ui/Textarea";
import Modal from "../components/ui/Modal";

const statusOptions = ["all", "pending", "verified", "in_progress", "resolved", "rejected"];

const STATUS_ACTIONS = {
  pending: [
    { value: "verified", label: "Verify" },
    { value: "rejected", label: "Reject", danger: true },
  ],
  verified: [
    { value: "in_progress", label: "Mark In Progress" },
    { value: "resolved", label: "Resolve" },
    { value: "rejected", label: "Reject", danger: true },
  ],
  in_progress: [{ value: "resolved", label: "Resolve" }],
  resolved: [],
  rejected: [],
};

function formatCategoryHierarchy(incident) {
  const parent = incident?.parent_category_name || "Uncategorized";
  return incident?.category_name ? `${parent} > ${incident.category_name}` : parent;
}

function formatReporterName(incident) {
  const first = incident?.reported_by_first_name || "";
  const last = incident?.reported_by_last_name || "";
  const full = `${first} ${last}`.trim();
  return full || "Unknown Resident";
}

export default function OfficialIncidents() {
  const { token } = useAuth();

  const [incidents, setIncidents] = useState([]);
  const [loadingIncidents, setLoadingIncidents] = useState(true);
  const [incidentsError, setIncidentsError] = useState("");

  const [statusFilter, setStatusFilter] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");

  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [selectedIncident, setSelectedIncident] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailError, setDetailError] = useState("");
  const [detailImageUrl, setDetailImageUrl] = useState("");

  const [statusActionLoading, setStatusActionLoading] = useState(false);
  const [statusActionMessage, setStatusActionMessage] = useState("");
  const [statusActionError, setStatusActionError] = useState("");

  const [responseText, setResponseText] = useState("");
  const [responseLoading, setResponseLoading] = useState(false);
  const [responseMessage, setResponseMessage] = useState("");
  const [responseError, setResponseError] = useState("");

  const loadIncidents = async () => {
    setLoadingIncidents(true);
    setIncidentsError("");

    try {
      const data = await apiRequest("/incidents", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      setIncidents(Array.isArray(data) ? data : []);
    } catch (err) {
      setIncidentsError(err.message || "Failed to load incident queue");
    } finally {
      setLoadingIncidents(false);
    }
  };

  useEffect(() => {
    if (!token) return;
    loadIncidents();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  const visibleIncidents = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();

    return incidents.filter((incident) => {
      if (statusFilter !== "all" && incident.status !== statusFilter) {
        return false;
      }

      if (!term) return true;

      const haystack = [
        incident.title,
        incident.description,
        incident.category_name,
        incident.parent_category_name,
        incident.reported_by_first_name,
        incident.reported_by_last_name,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      return haystack.includes(term);
    });
  }, [incidents, statusFilter, searchTerm]);

  const mergeIncidentIntoQueue = (updatedIncident) => {
    if (!updatedIncident?.id) return;

    setIncidents((prev) =>
      prev.map((item) =>
        item.id === updatedIncident.id
          ? {
              ...item,
              ...updatedIncident,
            }
          : item
      )
    );
  };

  const openDetailModal = async (incidentId) => {
    setDetailModalOpen(true);
    setDetailLoading(true);
    setDetailError("");
    setDetailImageUrl("");
    setSelectedIncident(null);
    setStatusActionMessage("");
    setStatusActionError("");
    setResponseMessage("");
    setResponseError("");

    try {
      const data = await apiRequest(`/incidents/${incidentId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      setSelectedIncident(data);

      const firstAttachment = Array.isArray(data.attachments) ? data.attachments[0] : null;
      if (firstAttachment?.storage_path) {
        const url = await getDownloadURL(ref(storage, firstAttachment.storage_path));
        setDetailImageUrl(url);
      }
    } catch (err) {
      setDetailError(err.message || "Failed to load incident details");
    } finally {
      setDetailLoading(false);
    }
  };

  const refreshIncidentDetail = async (incidentId) => {
    const data = await apiRequest(`/incidents/${incidentId}`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    setSelectedIncident(data);
    mergeIncidentIntoQueue(data);

    const firstAttachment = Array.isArray(data.attachments) ? data.attachments[0] : null;
    if (firstAttachment?.storage_path) {
      const url = await getDownloadURL(ref(storage, firstAttachment.storage_path));
      setDetailImageUrl(url);
    } else {
      setDetailImageUrl("");
    }
  };

  const handleStatusChange = async (nextStatus) => {
    if (!selectedIncident) return;

    setStatusActionLoading(true);
    setStatusActionError("");
    setStatusActionMessage("");

    try {
      const updated = await apiRequest(`/incidents/${selectedIncident.id}/status`, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ status: nextStatus }),
      });

      mergeIncidentIntoQueue(updated);
      await refreshIncidentDetail(selectedIncident.id);
      setStatusActionMessage(`Status updated to ${nextStatus.replace("_", " ")}.`);
    } catch (err) {
      setStatusActionError(err.message || "Failed to update status");
      try {
        await refreshIncidentDetail(selectedIncident.id);
      } catch {
        // keep original error message visible
      }
    } finally {
      setStatusActionLoading(false);
    }
  };

  const handleSubmitResponse = async (event) => {
    event.preventDefault();
    if (!selectedIncident) return;

    const message = responseText.trim();
    if (!message) {
      setResponseError("Response message is required.");
      return;
    }

    if (message.length > 2000) {
      setResponseError("Response message must be 2000 characters or fewer.");
      return;
    }

    setResponseLoading(true);
    setResponseError("");
    setResponseMessage("");

    try {
      const created = await apiRequest(`/incidents/${selectedIncident.id}/response`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ message }),
      });

      setSelectedIncident((prev) => {
        if (!prev) return prev;

        const responses = Array.isArray(prev.responses) ? prev.responses : [];
        return {
          ...prev,
          responses: [...responses, created],
        };
      });

      setResponseText("");
      setResponseMessage("Response added.");
    } catch (err) {
      setResponseError(err.message || "Failed to submit response");
    } finally {
      setResponseLoading(false);
    }
  };

  const availableActions = STATUS_ACTIONS[selectedIncident?.status] || [];

  return (
    <>
      <section className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold text-neutral-900">Incident Queue</h1>
            <p className="text-sm text-neutral-600">Review reports, update statuses, and post barangay responses.</p>
          </div>
        </div>

        <Card>
          <div className="grid gap-3 md:grid-cols-[220px,1fr]">
            <div>
              <label className="text-sm font-medium text-neutral-800">Status</label>
              <select
                value={statusFilter}
                onChange={(event) => setStatusFilter(event.target.value)}
                className="mt-1 w-full"
              >
                {statusOptions.map((status) => (
                  <option key={status} value={status}>
                    {status === "all" ? "All statuses" : status.replace("_", " ")}
                  </option>
                ))}
              </select>
            </div>

            <Input
              label="Search"
              placeholder="Search title, category, description, or reporter"
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
            />
          </div>
        </Card>

        {incidentsError && <Alert tone="error">{incidentsError}</Alert>}

        {loadingIncidents ? (
          <Card>
            <p className="text-neutral-600">Loading incident queue...</p>
          </Card>
        ) : visibleIncidents.length === 0 ? (
          <Card>
            <p className="text-neutral-600">No incidents found for current filters.</p>
          </Card>
        ) : (
          visibleIncidents.map((incident) => (
            <div
              key={incident.id}
              className="w-full cursor-pointer"
              role="button"
              tabIndex={0}
              onClick={() => openDetailModal(incident.id)}
              onKeyDown={(event) => {
                if (event.key === "Enter" || event.key === " ") {
                  event.preventDefault();
                  openDetailModal(incident.id);
                }
              }}
            >
              <Card className="transition hover:border-brand-300 hover:bg-brand-50">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div>
                    <h3 className="text-lg font-semibold text-neutral-900">{incident.title}</h3>
                    <p className="mt-1 text-sm text-neutral-600">Reported by {formatReporterName(incident)}</p>
                  </div>
                  <StatusChip status={incident.status} />
                </div>

                <p className="mt-3 text-sm text-neutral-700">{incident.description}</p>

                <div className="mt-3 flex flex-wrap items-center justify-between gap-2 text-sm text-neutral-600">
                  <p>{formatCategoryHierarchy(incident)}</p>
                  <p>{new Date(incident.created_at).toLocaleString()}</p>
                </div>

                <div className="mt-3">
                  <Button
                    variant="secondary"
                    className="px-3 py-1.5 text-xs"
                    onClick={(event) => {
                      event.stopPropagation();
                      openDetailModal(incident.id);
                    }}
                  >
                    View Details
                  </Button>
                </div>
              </Card>
            </div>
          ))
        )}
      </section>

      <Modal
        open={detailModalOpen}
        onClose={() => setDetailModalOpen(false)}
        title="Incident Details"
        className="max-w-3xl"
      >
        {detailLoading && <p className="text-neutral-600">Loading incident details...</p>}
        {!detailLoading && detailError && <Alert tone="error">{detailError}</Alert>}

        {!detailLoading && !detailError && selectedIncident && (
          <div className="space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h3 className="text-xl font-semibold text-neutral-900">{selectedIncident.title}</h3>
              <StatusChip status={selectedIncident.status} />
            </div>

            <p className="text-neutral-700">{selectedIncident.description}</p>

            <div className="grid gap-1 text-sm text-neutral-600">
              <p>Reported by: {formatReporterName(selectedIncident)}</p>
              <p>Category: {formatCategoryHierarchy(selectedIncident)}</p>
              <p>Coordinates: {selectedIncident.latitude}, {selectedIncident.longitude}</p>
              <p>Created: {new Date(selectedIncident.created_at).toLocaleString()}</p>
              <p>ID: {selectedIncident.id}</p>
            </div>

            <section className="space-y-2">
              <h4 className="text-sm font-semibold text-neutral-900">Attachment</h4>
              {detailImageUrl ? (
                <img
                  src={detailImageUrl}
                  alt="Incident attachment"
                  className="w-full max-w-xl rounded-lg border border-neutral-200"
                />
              ) : (
                <p className="text-sm text-neutral-600">No attachment</p>
              )}
            </section>

            <section className="space-y-2">
              <h4 className="text-sm font-semibold text-neutral-900">Status Actions</h4>
              {statusActionError && <Alert tone="error">{statusActionError}</Alert>}
              {statusActionMessage && <Alert tone="success">{statusActionMessage}</Alert>}

              {availableActions.length === 0 ? (
                <p className="text-sm text-neutral-600">No further status transitions available.</p>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {availableActions.map((action) => (
                    <Button
                      key={action.value}
                      type="button"
                      variant={action.danger ? "danger" : "secondary"}
                      disabled={statusActionLoading}
                      onClick={() => handleStatusChange(action.value)}
                    >
                      {statusActionLoading ? "Updating..." : action.label}
                    </Button>
                  ))}
                </div>
              )}
            </section>

            <section className="space-y-2">
              <h4 className="text-sm font-semibold text-neutral-900">Barangay Response Timeline</h4>

              {Array.isArray(selectedIncident.responses) && selectedIncident.responses.length > 0 ? (
                <div className="space-y-2">
                  {selectedIncident.responses.map((response) => (
                    <Card key={response.id} className="border-neutral-200 bg-neutral-50">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <p className="text-sm font-semibold text-neutral-900">
                          {`${response.responded_by_first_name || ""} ${response.responded_by_last_name || ""}`.trim() ||
                            "Barangay Official"}
                        </p>
                        <p className="text-xs text-neutral-600">{new Date(response.created_at).toLocaleString()}</p>
                      </div>
                      <p className="mt-2 text-sm text-neutral-700">{response.message}</p>
                    </Card>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-neutral-600">No responses yet.</p>
              )}

              <form onSubmit={handleSubmitResponse} className="space-y-2 border-t border-neutral-200 pt-3">
                {responseError && <Alert tone="error">{responseError}</Alert>}
                {responseMessage && <Alert tone="success">{responseMessage}</Alert>}

                <Textarea
                  label="Add Response"
                  rows={4}
                  value={responseText}
                  onChange={(event) => setResponseText(event.target.value)}
                  maxLength={2000}
                  placeholder="Write the official action taken or advisory for this incident"
                />

                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="text-xs text-neutral-500">{responseText.length}/2000</p>
                  <Button type="submit" disabled={responseLoading}>
                    {responseLoading ? "Submitting..." : "Submit Response"}
                  </Button>
                </div>
              </form>
            </section>
          </div>
        )}
      </Modal>
    </>
  );
}
