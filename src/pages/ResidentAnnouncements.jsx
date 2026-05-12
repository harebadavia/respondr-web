import { useEffect, useMemo, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { apiAuthRequest } from "../services/api";
import Card from "../components/ui/Card";
import Alert from "../components/ui/Alert";
import RolePageHeader from "../components/ui/RolePageHeader";
import Button from "../components/ui/Button";
import Modal from "../components/ui/Modal";
import { ListToolbar, Pagination } from "../components/ui/ListControls";
import { DATE_FILTER_OPTIONS, matchesDateFilter, paginateItems } from "../components/ui/listControlUtils";
import { FaBullhorn } from "react-icons/fa6";

export default function ResidentAnnouncements() {
  const { isAuthenticated } = useAuth();
  const [announcements, setAnnouncements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");
  const [query, setQuery] = useState("");
  const [dateFilter, setDateFilter] = useState("all");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [previewImageUrls, setPreviewImageUrls] = useState([]);
  const [previewImageIndex, setPreviewImageIndex] = useState(0);

  const sanitizeHtml = (html) => {
    if (typeof window === "undefined") return html;
    const parser = new DOMParser();
    const doc = parser.parseFromString(html || "", "text/html");
    doc.querySelectorAll("script").forEach((node) => node.remove());
    doc.querySelectorAll("*").forEach((node) => {
      [...node.attributes].forEach((attr) => {
        if (attr.name.toLowerCase().startsWith("on")) node.removeAttribute(attr.name);
      });
    });
    return doc.body.innerHTML;
  };

  const stripHtml = (html) => {
    if (!html) return "";
    if (typeof window === "undefined") return String(html);
    const parser = new DOMParser();
    return parser.parseFromString(html, "text/html").body.textContent || "";
  };

  const removeLegacyAttachmentsLabel = (html) => {
    return String(html || "").replace(
      /<hr\s*\/?>\s*<p>\s*<strong>\s*Attachments\s*<\/strong>\s*<\/p>/gi,
      ""
    );
  };

  const normalizeAnnouncementHtml = (html) => {
    if (typeof window === "undefined") return String(html || "");
    const parser = new DOMParser();
    const doc = parser.parseFromString(removeLegacyAttachmentsLabel(html || ""), "text/html");
    doc.querySelectorAll("hr").forEach((line) => {
      line.setAttribute("style", "margin:12px 0 14px 0;");
    });
    doc.querySelectorAll("p").forEach((paragraph) => {
      const link = paragraph.querySelector("a[href]");
      if (!link) return;
      const hasImage = Boolean(link.querySelector("img"));
      const text = paragraph.textContent?.trim() || "";
      if (!hasImage && !text) return;
      if (!hasImage && text.length > 80) return;
      paragraph.setAttribute("style", "display:inline-block;margin:0 8px 8px 0;vertical-align:top;");
    });
    doc.querySelectorAll("a[href]").forEach((link) => {
      const href = link.getAttribute("href") || "";
      const isImage = /\.(png|jpe?g|gif|webp|bmp|svg)(\?.*)?$/i.test(href);
      if (!isImage) link.setAttribute("download", "");
    });
    return doc.body.innerHTML;
  };

  const openImageGallery = (rootElement, clickedSrc) => {
    if (!rootElement || !clickedSrc) return;
    const urls = Array.from(rootElement.querySelectorAll("img[src]"))
      .map((img) => img.getAttribute("src") || "")
      .filter(Boolean);
    if (urls.length === 0) return;
    const clickedIndex = urls.findIndex((url) => url === clickedSrc);
    setPreviewImageUrls(urls);
    setPreviewImageIndex(clickedIndex >= 0 ? clickedIndex : 0);
  };

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
    return announcements.filter((item) => {
      if (!matchesDateFilter(item.created_at, dateFilter)) return false;
      if (!q) return true;
      return item.title?.toLowerCase().includes(q) ||
        stripHtml(item.content || "").toLowerCase().includes(q);
    });
  }, [announcements, dateFilter, query]);

  useEffect(() => {
    setPage(1);
  }, [query, dateFilter, pageSize]);

  const pagination = paginateItems(filteredAnnouncements, page, pageSize);

  return (
    <section className="space-y-4">
      <RolePageHeader
        role="resident"
        title="Announcements"
        subtitle="Latest barangay announcements."
        icon={FaBullhorn}
        right={(
          <div className="flex items-center gap-2">
            <span className="rounded-full bg-[#EAF3DE] px-2.5 py-1 text-xs font-bold text-[#3B6D11]">{announcements.length}</span>
            <Button type="button" variant="secondary" onClick={() => loadAnnouncements("refresh")} disabled={refreshing}>
              {refreshing ? "Refreshing..." : "Refresh"}
            </Button>
          </div>
        )}
      />

      <ListToolbar
        searchValue={query}
        onSearchChange={setQuery}
        searchPlaceholder="Search announcements"
        filters={[
          { id: "date", label: "Date", value: dateFilter, onChange: setDateFilter, options: DATE_FILTER_OPTIONS },
        ]}
        pageSize={pageSize}
        onPageSizeChange={setPageSize}
      />

      {error && <Alert tone="error">{error}</Alert>}

      {loading ? (
        <Card><p className="text-neutral-600">Loading announcements...</p></Card>
      ) : filteredAnnouncements.length === 0 ? (
        <Card>
          <p className="text-neutral-600">No announcements yet.</p>
        </Card>
      ) : (
        <div className="space-y-4">
          {pagination.pageItems.map((item) => (
            <Card key={item.id}>
              <h3 className="text-lg font-semibold text-neutral-900">{item.title}</h3>
              <div
                className="mt-2 prose prose-sm max-w-none text-neutral-700 [&_img]:h-[120px] [&_img]:w-[120px] [&_img]:object-cover [&_img]:rounded-lg [&_img]:border [&_img]:border-[var(--color-border-tertiary)] [&_img]:cursor-zoom-in [&_a]:inline-block"
                dangerouslySetInnerHTML={{ __html: sanitizeHtml(normalizeAnnouncementHtml(item.content || "")) }}
                onClick={(event) => {
                  const target = event.target;
                  if (!(target instanceof HTMLImageElement)) return;
                  event.preventDefault();
                  const src = target.getAttribute("src") || "";
                  if (!src) return;
                  openImageGallery(event.currentTarget, src);
                }}
              />
              <p className="mt-3 text-xs text-neutral-500">{new Date(item.created_at).toLocaleString()}</p>
            </Card>
          ))}
        </div>
      )}

      {!loading && filteredAnnouncements.length > 0 && (
        <Pagination
          page={pagination.safePage}
          totalPages={pagination.totalPages}
          totalItems={filteredAnnouncements.length}
          start={pagination.start}
          end={pagination.end}
          onPageChange={setPage}
        />
      )}

      <Modal
        open={previewImageUrls.length > 0}
        onClose={() => {
          setPreviewImageUrls([]);
          setPreviewImageIndex(0);
        }}
        title="Image Preview"
        className="max-w-4xl"
      >
        {previewImageUrls.length > 0 ? (
          <div className="space-y-3">
            <img
              src={previewImageUrls[previewImageIndex]}
              alt="Announcement attachment"
              className="max-h-[75vh] w-full rounded-lg border border-[var(--color-border-tertiary)] object-contain"
            />
            {previewImageUrls.length > 1 ? (
              <div className="flex items-center justify-between">
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() =>
                    setPreviewImageIndex((prev) => (prev - 1 + previewImageUrls.length) % previewImageUrls.length)
                  }
                >
                  Previous
                </Button>
                <span className="text-xs text-[var(--color-text-tertiary)]">
                  {previewImageIndex + 1} / {previewImageUrls.length}
                </span>
                <div className="flex items-center gap-2">
                  <a
                    href={previewImageUrls[previewImageIndex]}
                    download
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <Button type="button" variant="secondary">Download</Button>
                  </a>
                  <Button
                    type="button"
                    variant="secondary"
                    onClick={() =>
                      setPreviewImageIndex((prev) => (prev + 1) % previewImageUrls.length)
                    }
                  >
                    Next
                  </Button>
                </div>
              </div>
            ) : (
              <div className="flex justify-end">
                <a
                  href={previewImageUrls[previewImageIndex]}
                  download
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <Button type="button" variant="secondary">Download</Button>
                </a>
              </div>
            )}
          </div>
        ) : null}
      </Modal>
    </section>
  );
}
