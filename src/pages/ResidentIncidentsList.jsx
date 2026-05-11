import { useEffect, useMemo, useState } from "react";
import { getDownloadURL, ref } from "firebase/storage";
import {
  FaCloudRain,
  FaCarCrash,
  FaRoad,
  FaShieldAlt,
  FaShapes,
  FaFire,
  FaPlus,
} from "react-icons/fa";
import { storage } from "../firebase";
import { useAuth } from "../context/AuthContext";
import { apiAuthRequest } from "../services/api";
import { uploadIncidentImage } from "../services/storage";
import Card from "../components/ui/Card";
import StatusChip from "../components/ui/StatusChip";
import Alert from "../components/ui/Alert";
import Button from "../components/ui/Button";
import Input from "../components/ui/Input";
import Textarea from "../components/ui/Textarea";
import Modal from "../components/ui/Modal";

const categoryIcons = {
  "natural-disasters": FaCloudRain,
  "accidents-and-fires": FaCarCrash,
  infrastructure: FaRoad,
  "criminal-and-security": FaShieldAlt,
  others: FaShapes,
};

export default function ResidentIncidentsList() {
  const { isAuthenticated, firebaseUser } = useAuth();

  const [incidents, setIncidents] = useState([]);
  const [loadingIncidents, setLoadingIncidents] = useState(true);
  const [incidentsError, setIncidentsError] = useState("");
  const [query, setQuery] = useState("");

  const [categories, setCategories] = useState([]);
  const [loadingCategories, setLoadingCategories] = useState(true);
  const [categoriesError, setCategoriesError] = useState("");

  const [submitModalOpen, setSubmitModalOpen] = useState(false);
  const [detailModalOpen, setDetailModalOpen] = useState(false);

  const [selectedCategoryId, setSelectedCategoryId] = useState("");
  const [selectedSubcategoryId, setSelectedSubcategoryId] = useState("");

  const [form, setForm] = useState({
    title: "",
    description: "",
    latitude: "",
    longitude: "",
  });
  const [imageFile, setImageFile] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [submitMessage, setSubmitMessage] = useState("");
  const [pendingAttachment, setPendingAttachment] = useState(null);

  const [selectedIncident, setSelectedIncident] = useState(null);
  const [selectedIncidentImages, setSelectedIncidentImages] = useState([]);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailError, setDetailError] = useState("");

  const selectedCategory = useMemo(
    () => categories.find((item) => item.id === selectedCategoryId) || null,
    [categories, selectedCategoryId]
  );

  const selectedSubcategory = useMemo(
    () => selectedCategory?.subcategories?.find((item) => item.id === selectedSubcategoryId) || null,
    [selectedCategory, selectedSubcategoryId]
  );

  const filteredIncidents = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return incidents;
    return incidents.filter((incident) => {
      const category = `${incident.parent_category_name || ""} ${incident.category_name || ""} ${incident.incident_type || ""}`.toLowerCase();
      return (
        incident.title?.toLowerCase().includes(q) ||
        incident.description?.toLowerCase().includes(q) ||
        category.includes(q)
      );
    });
  }, [incidents, query]);

  const loadIncidents = async () => {
    setLoadingIncidents(true);
    setIncidentsError("");

    try {
      const data = await apiAuthRequest("/incidents/my");
      setIncidents(Array.isArray(data) ? data : []);
    } catch (err) {
      setIncidentsError(err.message || "Failed to load reports");
    } finally {
      setLoadingIncidents(false);
    }
  };

  const loadCategories = async () => {
    setLoadingCategories(true);
    setCategoriesError("");

    try {
      const data = await apiAuthRequest("/incident-categories");
      setCategories(Array.isArray(data) ? data : []);
    } catch (err) {
      setCategoriesError(err.message || "Failed to load categories");
    } finally {
      setLoadingCategories(false);
    }
  };

  useEffect(() => {
    if (!isAuthenticated) return;
    loadIncidents();
    loadCategories();
  }, [isAuthenticated]);

  const onChange = (event) => {
    setForm((prev) => ({
      ...prev,
      [event.target.name]: event.target.value,
    }));
  };

  const applyBrowserLocation = () => {
    if (!navigator.geolocation) {
      setSubmitError("Geolocation is not supported by this browser.");
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setForm((prev) => ({
          ...prev,
          latitude: String(position.coords.latitude),
          longitude: String(position.coords.longitude),
        }));
      },
      () => {
        setSubmitError("Unable to get current location.");
      },
      { enableHighAccuracy: true }
    );
  };

  const resetSubmitState = () => {
    setSelectedCategoryId("");
    setSelectedSubcategoryId("");
    setForm({ title: "", description: "", latitude: "", longitude: "" });
    setImageFile(null);
    setSubmitError("");
    setSubmitMessage("");
    setPendingAttachment(null);
  };

  const closeSubmitModal = () => {
    setSubmitModalOpen(false);
    resetSubmitState();
  };

  const registerAttachment = async (incidentId, metadata) => {
    return apiAuthRequest(`/incidents/${incidentId}/attachments`, {
      method: "POST",
      body: JSON.stringify(metadata),
    });
  };

  const handleRetryAttachment = async () => {
    if (!pendingAttachment) return;

    try {
      await registerAttachment(pendingAttachment.incidentId, pendingAttachment.metadata);
      setPendingAttachment(null);
      setSubmitMessage("Attachment metadata registration completed.");
      await loadIncidents();
    } catch (err) {
      setSubmitError(`Attachment retry failed: ${err.message}`);
    }
  };

  const handleSubmitReport = async (event) => {
    event.preventDefault();
    setSubmitError("");
    setSubmitMessage("");
    setSubmitting(true);

    try {
      if (!selectedSubcategoryId) {
        throw new Error("Please select a report subcategory.");
      }

      const latitude = Number(form.latitude);
      const longitude = Number(form.longitude);
      if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) {
        throw new Error("Latitude and longitude are required numbers.");
      }

      const payload = {
        title: form.title.trim(),
        description: form.description.trim(),
        category_id: selectedSubcategoryId,
        incident_type: selectedSubcategory?.name || null,
        latitude,
        longitude,
      };

      if (!payload.title || !payload.description) {
        throw new Error("Title and description are required.");
      }

      const incident = await apiAuthRequest("/incidents", {
        method: "POST",
        body: JSON.stringify(payload),
      });

      let hasPendingAttachment = false;

      if (imageFile) {
        const metadata = await uploadIncidentImage({
          file: imageFile,
          firebaseUid: firebaseUser?.uid,
          incidentId: incident.id,
        });

        try {
          await registerAttachment(incident.id, metadata);
        } catch (err) {
          hasPendingAttachment = true;
          setPendingAttachment({ incidentId: incident.id, metadata });
          setSubmitError(`Report created, but attachment registration failed: ${err.message}`);
        }
      }

      await loadIncidents();
      setSubmitMessage("Report submitted successfully.");
      if (!hasPendingAttachment) {
        closeSubmitModal();
      }
    } catch (err) {
      setSubmitError(err.message || "Failed to submit report.");
    } finally {
      setSubmitting(false);
    }
  };

  const openDetailModal = async (incidentId) => {
    setDetailModalOpen(true);
    setDetailLoading(true);
    setDetailError("");
    setSelectedIncident(null);
    setSelectedIncidentImages([]);

    try {
      const data = await apiAuthRequest(`/incidents/${incidentId}`);
      setSelectedIncident(data);

      const attachments = Array.isArray(data.attachments) ? data.attachments : [];
      const imageAttachments = attachments.filter((item) => String(item?.mime_type || "").startsWith("image/"));
      const resolvedImages = await Promise.all(
        imageAttachments.map(async (item) => {
          try {
            let url = item.file_url || "";
            if (!url && item.storage_path) {
              url = await getDownloadURL(ref(storage, item.storage_path));
            }
            if (!url) return null;
            return {
              id: item.id,
              url,
              fileName: item.file_name || "Attachment",
            };
          } catch {
            return null;
          }
        })
      );
      setSelectedIncidentImages(resolvedImages.filter(Boolean));
    } catch (err) {
      setDetailError(err.message || "Failed to load report details");
    } finally {
      setDetailLoading(false);
    }
  };

  return (
    <>
      <section className="space-y-4">
        <div className="rounded-2xl border border-[var(--color-border-tertiary)] bg-white px-5 py-5 shadow-[0_4px_14px_rgba(15,23,42,0.06)]">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold">Reports</h1>
              <span className="rounded-full bg-[#EAF3DE] px-2 py-0.5 text-xs font-bold text-[#3B6D11]">
                {incidents.length}
              </span>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => loadIncidents()}
                className="rounded-full border border-[var(--color-border-secondary)] bg-white px-4 py-2 text-sm font-semibold text-[var(--color-text-primary)] transition hover:bg-[var(--color-background-secondary)]"
              >
                Refresh
              </button>
              <button
                type="button"
                onClick={() => setSubmitModalOpen(true)}
                className="inline-flex items-center gap-2 rounded-full bg-[#185FA5] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[#0C447C]"
              >
                <FaPlus /> File a report
              </button>
            </div>
          </div>
          <p className="mt-1 text-sm text-[var(--color-text-secondary)]">Submit and track your incident reports.</p>
        </div>

        <div className="flex items-center gap-2 rounded-2xl border border-[var(--color-border-tertiary)] bg-white px-4 py-2 shadow-[0_4px_14px_rgba(15,23,42,0.06)]">
          <span className="text-[var(--color-text-tertiary)]">🔍</span>
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search reports"
            className="border-0 p-0 text-sm focus:ring-0"
          />
        </div>

        {incidentsError && <Alert tone="error">{incidentsError}</Alert>}
        {categoriesError && <Alert tone="error">{categoriesError}</Alert>}

        {loadingIncidents ? (
          <Card><p className="text-neutral-600">Loading reports...</p></Card>
        ) : filteredIncidents.length === 0 ? (
          <Card><p className="text-neutral-600">No reports yet.</p></Card>
        ) : (
          filteredIncidents.map((incident) => (
            <div
              key={incident.id}
              onClick={() => openDetailModal(incident.id)}
              className="w-full cursor-pointer text-left"
              role="button"
              tabIndex={0}
              onKeyDown={(event) => {
                if (event.key === "Enter" || event.key === " ") {
                  event.preventDefault();
                  openDetailModal(incident.id);
                }
              }}
            >
              <Card className="transition hover:border-[#B5D4F4] hover:shadow-md">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <h3 className="text-lg font-semibold text-neutral-900">{incident.title}</h3>
                    <p className="mt-1 text-sm text-neutral-600">{incident.description}</p>
                  </div>
                  <StatusChip status={incident.status} />
                </div>

                <div className="mt-3 flex flex-wrap items-center justify-between gap-2 text-sm text-neutral-600">
                  <p>
                    {incident.parent_category_name || "Uncategorized"}
                    {incident.category_name ? ` > ${incident.category_name}` : ""}
                  </p>
                  <p>{new Date(incident.created_at).toLocaleString()}</p>
                </div>

                <div className="mt-3 flex flex-wrap gap-2">
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

      <Modal open={submitModalOpen} onClose={closeSubmitModal} title="Submit Report">
        {submitError && <Alert className="mb-3" tone="error">{submitError}</Alert>}
        {submitMessage && <Alert className="mb-3" tone="success">{submitMessage}</Alert>}

        <div className="space-y-4">
          <section>
            <h3 className="text-sm font-semibold text-neutral-900">Category</h3>
            {loadingCategories ? (
              <p className="mt-2 text-sm text-neutral-600">Loading categories...</p>
            ) : (
              <div className="mt-2 grid grid-cols-2 gap-2 md:grid-cols-3">
                {categories.map((category) => {
                  const Icon = categoryIcons[category.slug] || FaFire;
                  const selected = selectedCategoryId === category.id;

                  return (
                    <button
                      key={category.id}
                      type="button"
                      onClick={() => {
                        setSelectedCategoryId(category.id);
                        setSelectedSubcategoryId("");
                      }}
                      className={`rounded-md border p-3 text-left transition ${selected ? "border-[#378ADD] bg-[#E6F1FB]" : "border-neutral-200 hover:border-[#B5D4F4]"}`}
                    >
                      <Icon className="mb-2 text-lg text-brand-700" />
                      <p className="text-sm font-medium text-neutral-900">{category.name}</p>
                    </button>
                  );
                })}
              </div>
            )}
          </section>

          <section>
            <h3 className="text-sm font-semibold text-neutral-900">Subcategory</h3>
            <div className="mt-2 grid grid-cols-2 gap-2 md:grid-cols-3">
              {(selectedCategory?.subcategories || []).map((subcategory) => {
                const selected = selectedSubcategoryId === subcategory.id;
                return (
                  <button
                    key={subcategory.id}
                    type="button"
                    onClick={() => setSelectedSubcategoryId(subcategory.id)}
                    className={`rounded-md border px-3 py-2 text-sm text-left transition ${selected ? "border-[#378ADD] bg-[#E6F1FB] text-[#185FA5]" : "border-neutral-200 text-neutral-700 hover:border-[#B5D4F4]"}`}
                  >
                    {subcategory.name}
                  </button>
                );
              })}
            </div>
          </section>

          <form onSubmit={handleSubmitReport} className="grid gap-3">
            <Input name="title" label="Title" value={form.title} onChange={onChange} required />
            <Textarea name="description" label="Description" value={form.description} onChange={onChange} rows={4} required />

            <div className="grid gap-3 md:grid-cols-2">
              <Input name="latitude" label="Latitude" value={form.latitude} onChange={onChange} required />
              <Input name="longitude" label="Longitude" value={form.longitude} onChange={onChange} required />
            </div>

            <div className="flex flex-wrap gap-2">
              <Button type="button" variant="secondary" onClick={applyBrowserLocation}>Use Current Location</Button>
            </div>

            <div>
              <label>Image (optional, auto-compressed to &lt; 400KB)</label>
              <input
                type="file"
                accept="image/jpeg,image/webp,image/*"
                onChange={(event) => {
                  const nextFile = event.target.files?.[0] || null;
                  setImageFile(nextFile);
                }}
              />
            </div>

            <div className="flex flex-wrap gap-2 pt-1">
              <Button type="submit" disabled={submitting}>{submitting ? "Submitting..." : "Submit Report"}</Button>
              <Button type="button" variant="secondary" onClick={closeSubmitModal}>Cancel</Button>
            </div>
          </form>

          {pendingAttachment && (
            <Card className="border-amber-200 bg-amber-50">
              <p className="text-sm text-amber-800">Attachment upload succeeded but metadata registration is pending.</p>
              <Button className="mt-3" type="button" variant="secondary" onClick={handleRetryAttachment}>
                Retry Attachment Registration
              </Button>
            </Card>
          )}
        </div>
      </Modal>

      <Modal open={detailModalOpen} onClose={() => setDetailModalOpen(false)} title="Report Details" className="max-w-3xl">
        {detailLoading && <p className="text-neutral-600">Loading report details...</p>}
        {!detailLoading && detailError && <Alert tone="error">{detailError}</Alert>}

        {!detailLoading && !detailError && selectedIncident && (
          <div className="space-y-4">
            <div className="rounded-xl border border-[var(--color-border-tertiary)] bg-white px-5 py-5 shadow-[0_4px_14px_rgba(15,23,42,0.06)]">
              <div className="mb-3 inline-flex items-center rounded-full bg-[#E6F1FB] px-3 py-1 text-xs font-semibold uppercase tracking-wide text-[#185FA5]">
                {String(selectedIncident.status || "pending").replace(/_/g, " ")}
              </div>
              <h3 className="text-2xl font-bold text-[var(--color-text-primary)]">{selectedIncident.title}</h3>
              <p className="mt-1 text-xs text-[var(--color-text-tertiary)]">{new Date(selectedIncident.created_at).toLocaleString()}</p>
            </div>

            <Card>
              <h4 className="text-sm font-semibold uppercase tracking-wide text-neutral-700">Description</h4>
              <p className="mt-2 text-neutral-700">{selectedIncident.description}</p>
            </Card>

            <Card>
              <h4 className="text-sm font-semibold uppercase tracking-wide text-neutral-700">Incident Details</h4>
              <div className="mt-2 grid gap-1 text-sm text-neutral-600">
                <p>
                  Category: {selectedIncident.parent_category_name || "N/A"}
                  {selectedIncident.category_name ? ` > ${selectedIncident.category_name}` : ""}
                </p>
                <p>Coordinates: {selectedIncident.latitude}, {selectedIncident.longitude}</p>
                <p>Created: {new Date(selectedIncident.created_at).toLocaleString()}</p>
                <p>ID: {selectedIncident.id}</p>
              </div>
            </Card>

            <Card>
              <h4 className="text-sm font-semibold uppercase tracking-wide text-neutral-700">
                Photo Gallery{selectedIncidentImages.length ? ` · ${selectedIncidentImages.length}` : ""}
              </h4>
              {selectedIncidentImages.length ? (
                <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
                  {selectedIncidentImages.map((image) => (
                    <a key={image.id} href={image.url} target="_blank" rel="noreferrer" className="block">
                      <img
                        src={image.url}
                        alt={image.fileName}
                        className="h-40 w-full rounded-lg border border-neutral-200 object-cover"
                      />
                      <p className="mt-1 truncate text-xs text-neutral-600">{image.fileName}</p>
                    </a>
                  ))}
                </div>
              ) : (
                <p className="mt-2 text-sm text-neutral-600">No attachment</p>
              )}
            </Card>

            <Card>
              <h4 className="text-sm font-semibold uppercase tracking-wide text-neutral-700">Response Timeline</h4>
              {Array.isArray(selectedIncident.responses) && selectedIncident.responses.length > 0 ? (
                <div className="mt-3 space-y-3">
                  {selectedIncident.responses.map((response, index) => (
                    <div key={response.id} className="flex gap-3">
                      <div className="flex w-5 flex-col items-center">
                        <span className="mt-1 h-3 w-3 rounded-full bg-[#378ADD]" />
                        {index < selectedIncident.responses.length - 1 && <span className="mt-1 h-full w-px bg-neutral-300" />}
                      </div>
                      <div className="flex-1 rounded-lg border border-neutral-200 bg-neutral-50 p-3">
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <p className="text-sm font-semibold text-neutral-900">
                            {`${response.responded_by_first_name || ""} ${response.responded_by_last_name || ""}`.trim() ||
                              "Barangay Official"}
                          </p>
                          <p className="text-xs text-neutral-600">{new Date(response.created_at).toLocaleString()}</p>
                        </div>
                        <p className="mt-2 text-sm text-neutral-700">{response.message}</p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="mt-2 text-sm text-neutral-600">No barangay responses yet.</p>
              )}
            </Card>
          </div>
        )}
      </Modal>
    </>
  );
}
