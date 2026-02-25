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
import { apiRequest } from "../services/api";
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
  const { token, firebaseUser } = useAuth();

  const [incidents, setIncidents] = useState([]);
  const [loadingIncidents, setLoadingIncidents] = useState(true);
  const [incidentsError, setIncidentsError] = useState("");

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
  const [selectedIncidentImageUrl, setSelectedIncidentImageUrl] = useState("");
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

  const loadIncidents = async () => {
    setLoadingIncidents(true);
    setIncidentsError("");

    try {
      const data = await apiRequest("/incidents/my", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
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
      const data = await apiRequest("/incident-categories", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      setCategories(Array.isArray(data) ? data : []);
    } catch (err) {
      setCategoriesError(err.message || "Failed to load categories");
    } finally {
      setLoadingCategories(false);
    }
  };

  useEffect(() => {
    if (!token) return;

    loadIncidents();
    loadCategories();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

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
    return apiRequest(`/incidents/${incidentId}/attachments`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
      },
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

      const incident = await apiRequest("/incidents", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
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
    setSelectedIncidentImageUrl("");

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
        setSelectedIncidentImageUrl(url);
      }
    } catch (err) {
      setDetailError(err.message || "Failed to load report details");
    } finally {
      setDetailLoading(false);
    }
  };

  return (
    <>
      <section className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold text-neutral-900">Reports</h1>
            <p className="text-sm text-neutral-600">Submit and track your incident reports.</p>
          </div>

          <Button onClick={() => setSubmitModalOpen(true)} className="gap-2">
            <FaPlus /> Submit Report
          </Button>
        </div>

        {incidentsError && <Alert tone="error">{incidentsError}</Alert>}
        {categoriesError && <Alert tone="error">{categoriesError}</Alert>}

        {loadingIncidents ? (
          <Card><p className="text-neutral-600">Loading reports...</p></Card>
        ) : incidents.length === 0 ? (
          <Card><p className="text-neutral-600">No reports yet.</p></Card>
        ) : (
          incidents.map((incident) => (
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
              <Card className="transition hover:border-brand-300 hover:bg-brand-50">
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
                      className={`rounded-md border p-3 text-left transition ${selected ? "border-brand-400 bg-brand-50" : "border-neutral-200 hover:border-brand-200"}`}
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
                    className={`rounded-md border px-3 py-2 text-sm text-left transition ${selected ? "border-brand-400 bg-brand-50 text-brand-800" : "border-neutral-200 text-neutral-700 hover:border-brand-200"}`}
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

      <Modal open={detailModalOpen} onClose={() => setDetailModalOpen(false)} title="Report Details" className="max-w-2xl">
        {detailLoading && <p className="text-neutral-600">Loading report details...</p>}
        {!detailLoading && detailError && <Alert tone="error">{detailError}</Alert>}

        {!detailLoading && !detailError && selectedIncident && (
          <div className="space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h3 className="text-xl font-semibold text-neutral-900">{selectedIncident.title}</h3>
              <StatusChip status={selectedIncident.status} />
            </div>

            <p className="text-neutral-700">{selectedIncident.description}</p>

            <div className="grid gap-1 text-sm text-neutral-600">
              <p>
                Category: {selectedIncident.parent_category_name || "N/A"}
                {selectedIncident.category_name ? ` > ${selectedIncident.category_name}` : ""}
              </p>
              <p>Coordinates: {selectedIncident.latitude}, {selectedIncident.longitude}</p>
              <p>Created: {new Date(selectedIncident.created_at).toLocaleString()}</p>
              <p>ID: {selectedIncident.id}</p>
            </div>

            <div>
              <h4 className="text-sm font-semibold text-neutral-900">Attachment</h4>
              {selectedIncidentImageUrl ? (
                <img
                  src={selectedIncidentImageUrl}
                  alt="Report attachment"
                  className="mt-2 w-full max-w-lg rounded-lg border border-neutral-200"
                />
              ) : (
                <p className="mt-2 text-sm text-neutral-600">No attachment</p>
              )}
            </div>
          </div>
        )}
      </Modal>
    </>
  );
}
