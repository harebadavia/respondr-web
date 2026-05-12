import { useEffect, useMemo, useRef, useState } from "react";
import { getDownloadURL, ref, uploadBytes } from "firebase/storage";
import { useAuth } from "../context/AuthContext";
import { apiAuthRequest } from "../services/api";
import { storage } from "../firebase";
import { compressImageForUpload } from "../services/storage";
import Card from "../components/ui/Card";
import Alert from "../components/ui/Alert";
import Button from "../components/ui/Button";
import Input from "../components/ui/Input";
import RolePageHeader from "../components/ui/RolePageHeader";
import Modal from "../components/ui/Modal";
import { ListToolbar, Pagination } from "../components/ui/ListControls";
import { DATE_FILTER_OPTIONS, matchesDateFilter, paginateItems } from "../components/ui/listControlUtils";
import { FaBullhorn } from "react-icons/fa6";
import {
  FaBold,
  FaItalic,
  FaUnderline,
  FaListOl,
  FaListUl,
  FaLink,
  FaUnlink,
  FaUndo,
  FaRedo,
  FaEraser,
  FaTimes,
  FaFileAlt,
} from "react-icons/fa";

export default function OfficialAnnouncements() {
  const { isAuthenticated, firebaseUser } = useAuth();

  const [title, setTitle] = useState("");
  const [content, setContent] = useState("<p></p>");
  const [attachments, setAttachments] = useState([]);
  const [announcements, setAnnouncements] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [dateFilter, setDateFilter] = useState("all");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [uploadingAttachments, setUploadingAttachments] = useState(false);
  const [createOpen, setCreateOpen] = useState(false);
  const [editingAnnouncementId, setEditingAnnouncementId] = useState(null);
  const [previewImageUrls, setPreviewImageUrls] = useState([]);
  const [previewImageIndex, setPreviewImageIndex] = useState(0);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const editorRef = useRef(null);
  const savedRangeRef = useRef(null);
  const [linkEditorOpen, setLinkEditorOpen] = useState(false);
  const [linkUrl, setLinkUrl] = useState("");

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

  const textFromHtml = (html) => {
    if (typeof window === "undefined") return String(html || "").replace(/<[^>]*>/g, " ");
    const parser = new DOMParser();
    const doc = parser.parseFromString(html || "", "text/html");
    return doc.body.textContent || "";
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

  const splitContentAndAttachments = (html) => {
    if (typeof window === "undefined") {
      return { contentHtml: String(html || ""), extractedAttachments: [] };
    }

    const parser = new DOMParser();
    const doc = parser.parseFromString(removeLegacyAttachmentsLabel(html || ""), "text/html");
    const body = doc.body;
    const hrs = body.querySelectorAll("hr");
    if (hrs.length === 0) {
      return { contentHtml: body.innerHTML || "<p></p>", extractedAttachments: [] };
    }

    const splitHr = hrs[hrs.length - 1];
    const extractedAttachments = [];
    const nodesToRemove = [];
    let cursor = splitHr.nextSibling;

    while (cursor) {
      const next = cursor.nextSibling;
      if (cursor.nodeType === Node.ELEMENT_NODE) {
        const element = cursor;
        const link = element.querySelector("a[href]");
        const image = link?.querySelector("img");
        if (link) {
          const url = link.getAttribute("href") || image?.getAttribute("src") || "";
          if (url) {
            const name =
              image?.getAttribute("alt") ||
              link.textContent?.trim() ||
              url.split("/").pop()?.split("?")[0] ||
              "attachment";
            const isImage = Boolean(image) || /\.(png|jpe?g|gif|webp|bmp|svg)(\?.*)?$/i.test(url);
            extractedAttachments.push({
              name,
              url,
              mimeType: isImage ? "image/*" : "application/octet-stream",
            });
            nodesToRemove.push(cursor);
          }
        }
      }
      cursor = next;
    }

    if (extractedAttachments.length > 0) {
      nodesToRemove.forEach((node) => node.remove());
      splitHr.remove();
    }

    return { contentHtml: body.innerHTML || "<p></p>", extractedAttachments };
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

  const buildStoragePath = (uid, fileName) => {
    const safeName = String(fileName || "attachment").replace(/[^a-zA-Z0-9._-]/g, "_");
    return `incidents/${uid}/announcements/${Date.now()}_${safeName}.webp`;
  };

  const uploadAttachment = async (file) => {
    if (!firebaseUser?.uid) throw new Error("Missing user context for upload.");
    if (!String(file.type || "").startsWith("image/")) {
      throw new Error("Only image attachments are supported right now.");
    }
    const path = buildStoragePath(firebaseUser.uid, file.name);
    const compressed = await compressImageForUpload(file);
    const objectRef = ref(storage, path);
    await uploadBytes(objectRef, compressed.blob, { contentType: compressed.mimeType || "image/webp" });
    const url = await getDownloadURL(objectRef);
    return {
      name: file.name,
      url,
      mimeType: compressed.mimeType || "image/webp",
    };
  };

  const onAttachmentChange = async (event) => {
    const files = Array.from(event.target.files || []);
    if (files.length === 0) return;
    setUploadingAttachments(true);
    setError("");
    try {
      const uploaded = [];
      for (const file of files) {
        uploaded.push(await uploadAttachment(file));
      }
      setAttachments((prev) => [...prev, ...uploaded]);
    } catch (err) {
      setError(err.message || "Failed to upload attachment.");
    } finally {
      setUploadingAttachments(false);
      event.target.value = "";
    }
  };

  const removeAttachment = (url) => {
    if (!window.confirm("Remove this attachment?")) return;
    setAttachments((prev) => prev.filter((item) => item.url !== url));
  };

  const saveSelection = () => {
    const selection = window.getSelection();
    if (!selection || selection.rangeCount === 0) return;
    savedRangeRef.current = selection.getRangeAt(0).cloneRange();
  };

  const restoreSelection = () => {
    const selection = window.getSelection();
    if (!selection || !savedRangeRef.current) return false;
    selection.removeAllRanges();
    selection.addRange(savedRangeRef.current);
    return true;
  };

  const insertEditorCommand = (command, value = null) => {
    if (!editorRef.current) return;
    editorRef.current.focus();
    restoreSelection();
    document.execCommand("styleWithCSS", false, false);
    document.execCommand(command, false, value);
    setContent(editorRef.current.innerHTML);
    saveSelection();
  };

  const openLinkEditor = () => {
    if (!editorRef.current) return;
    editorRef.current.focus();
    restoreSelection();
    const selection = window.getSelection();
    const anchor = selection?.anchorNode?.parentElement?.closest("a");
    setLinkUrl(anchor?.getAttribute("href") || "");
    setLinkEditorOpen(true);
  };

  const applyLink = () => {
    if (!linkUrl.trim()) return;
    insertEditorCommand("createLink", linkUrl.trim());
    setLinkEditorOpen(false);
  };

  const removeLink = () => {
    insertEditorCommand("unlink");
    setLinkEditorOpen(false);
  };

  const toolbarButtonClass =
    "inline-flex h-7 w-7 items-center justify-center rounded-md border border-[var(--color-border-secondary)] bg-white text-[var(--color-text-secondary)] transition hover:bg-[var(--color-background-secondary)] hover:text-[var(--color-text-primary)]";

  const resetCreateForm = () => {
    setTitle("");
    setContent("<p></p>");
    setAttachments([]);
    setEditingAnnouncementId(null);
    if (editorRef.current) {
      editorRef.current.innerHTML = "<p></p>";
    }
  };

  const openCreateModal = () => {
    resetCreateForm();
    setCreateOpen(true);
  };

  const openEditModal = (announcement) => {
    const { contentHtml, extractedAttachments } = splitContentAndAttachments(announcement?.content || "<p></p>");
    const rawContent = normalizeAnnouncementHtml(contentHtml);
    setEditingAnnouncementId(announcement?.id ?? null);
    setTitle(announcement?.title || "");
    setContent(rawContent);
    setAttachments(extractedAttachments);
    setCreateOpen(true);
    if (editorRef.current) editorRef.current.innerHTML = rawContent;
  };

  useEffect(() => {
    if (createOpen && editorRef.current) {
      editorRef.current.innerHTML = content || "<p></p>";
      editorRef.current.focus();
      saveSelection();
    }
  }, [createOpen]); // eslint-disable-line react-hooks/exhaustive-deps

  const loadAnnouncements = async () => {
    setLoading(true);
    setError("");
    try {
      const data = await apiAuthRequest("/announcements");
      setAnnouncements(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err.message || "Failed to load announcements");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!isAuthenticated) return;
    loadAnnouncements();
  }, [isAuthenticated]);

  const filteredAnnouncements = useMemo(() => {
    const query = searchTerm.trim().toLowerCase();
    return announcements.filter((item) => {
      if (!matchesDateFilter(item.created_at, dateFilter)) return false;
      if (!query) return true;
      return [
        item.title,
        textFromHtml(item.content),
        item.created_at ? new Date(item.created_at).toLocaleString() : "",
      ].join(" ").toLowerCase().includes(query);
    });
  }, [announcements, dateFilter, searchTerm]);

  useEffect(() => {
    setPage(1);
  }, [searchTerm, dateFilter, pageSize]);

  const pagination = paginateItems(filteredAnnouncements, page, pageSize);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSubmitting(true);
    setError("");
    setMessage("");

    try {
      const rawHtml = editorRef.current?.innerHTML || content;
      const cleanContent = sanitizeHtml(rawHtml).trim();
      if (!title.trim() || !cleanContent || cleanContent === "<p></p>") {
        throw new Error("Title and content are required.");
      }

      const attachmentBlocks = attachments.map((item) => {
        if (String(item.mimeType).startsWith("image/")) {
          return `<span style="display:inline-block;margin:0 8px 8px 0;vertical-align:top;"><a href="${item.url}" target="_blank" rel="noopener noreferrer"><img src="${item.url}" alt="${item.name}" style="width:120px;height:120px;object-fit:cover;border-radius:8px;border:1px solid #d9e2ec;cursor:zoom-in;" /></a></span>`;
        }
        return `<span style="display:inline-block;margin:0 8px 8px 0;vertical-align:top;"><a href="${item.url}" target="_blank" rel="noopener noreferrer">${item.name}</a></span>`;
      }).join("");

      const finalContent = attachmentBlocks ? `${cleanContent}<hr />${attachmentBlocks}` : cleanContent;

      const isEditing = Boolean(editingAnnouncementId);
      const url = isEditing ? `/announcements/${editingAnnouncementId}` : "/announcements";
      const method = isEditing ? "PUT" : "POST";
      await apiAuthRequest(url, {
        method,
        body: JSON.stringify({ title: title.trim(), content: finalContent }),
      });

      resetCreateForm();
      setMessage(isEditing ? "Announcement updated." : "Announcement posted.");
      setCreateOpen(false);
      await loadAnnouncements();
    } catch (err) {
      setError(err.message || "Failed to post announcement");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <section className="space-y-4">
      <RolePageHeader
        role="official"
        title="Announcements"
        subtitle="Post barangay-wide announcements."
        icon={FaBullhorn}
        right={(
          <Button type="button" onClick={openCreateModal}>
            Create
          </Button>
        )}
      />

      {error && <Alert tone="error">{error}</Alert>}
      {message && <Alert tone="success">{message}</Alert>}

      <ListToolbar
        searchValue={searchTerm}
        onSearchChange={setSearchTerm}
        searchPlaceholder="Search announcements"
        filters={[
          { id: "date", label: "Date", value: dateFilter, onChange: setDateFilter, options: DATE_FILTER_OPTIONS },
        ]}
        pageSize={pageSize}
        onPageSizeChange={setPageSize}
      />

      {loading ? (
        <Card><p className="text-neutral-600">Loading announcements...</p></Card>
      ) : announcements.length === 0 ? (
        <Card><p className="text-neutral-600">No announcements yet.</p></Card>
      ) : filteredAnnouncements.length === 0 ? (
        <Card><p className="text-neutral-600">No announcements match your search.</p></Card>
      ) : (
        <div className="space-y-3">
          {pagination.pageItems.map((item) => (
            <Card key={item.id}>
              <div className="flex items-start justify-between gap-3">
                <h3 className="text-lg font-semibold text-neutral-900">{item.title}</h3>
                <Button type="button" variant="secondary" className="h-7 px-2 text-xs" onClick={() => openEditModal(item)}>
                  Edit
                </Button>
              </div>
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
              <p className="mt-2 text-xs text-neutral-500">{new Date(item.created_at).toLocaleString()}</p>
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
        open={createOpen}
        onClose={() => {
          setCreateOpen(false);
          resetCreateForm();
        }}
        title={editingAnnouncementId ? "Edit Announcement" : "Create Announcement"}
      >
        <form onSubmit={handleSubmit} className="space-y-3">
          <Input label="Title" value={title} onChange={(e) => setTitle(e.target.value)} required />

          <div>
            <label>Content</label>
            <div className="mb-2 flex flex-wrap items-center gap-1.5 rounded-lg border border-[var(--color-border-tertiary)] bg-[var(--color-background-secondary)] p-1.5">
              <div className="flex items-center gap-1 rounded-md bg-white p-0.5">
                <button type="button" title="Bold" className={toolbarButtonClass} onMouseDown={(e) => e.preventDefault()} onClick={() => insertEditorCommand("bold")}>
                  <FaBold className="text-[11px]" />
                </button>
                <button type="button" title="Italic" className={toolbarButtonClass} onMouseDown={(e) => e.preventDefault()} onClick={() => insertEditorCommand("italic")}>
                  <FaItalic className="text-[11px]" />
                </button>
                <button type="button" title="Underline" className={toolbarButtonClass} onMouseDown={(e) => e.preventDefault()} onClick={() => insertEditorCommand("underline")}>
                  <FaUnderline className="text-[11px]" />
                </button>
              </div>

              <div className="flex items-center gap-1 rounded-md bg-white p-0.5">
                <button type="button" title="Bulleted List" className={toolbarButtonClass} onMouseDown={(e) => e.preventDefault()} onClick={() => insertEditorCommand("insertUnorderedList")}>
                  <FaListUl className="text-[11px]" />
                </button>
                <button type="button" title="Numbered List" className={toolbarButtonClass} onMouseDown={(e) => e.preventDefault()} onClick={() => insertEditorCommand("insertOrderedList")}>
                  <FaListOl className="text-[11px]" />
                </button>
              </div>

              <div className="flex items-center gap-1 rounded-md bg-white p-0.5">
                <button type="button" title="Insert/Edit Link" className={toolbarButtonClass} onMouseDown={(e) => e.preventDefault()} onClick={openLinkEditor}>
                  <FaLink className="text-[11px]" />
                </button>
                <button type="button" title="Remove Link" className={toolbarButtonClass} onMouseDown={(e) => e.preventDefault()} onClick={removeLink}>
                  <FaUnlink className="text-[11px]" />
                </button>
                <button type="button" title="Clear Formatting" className={toolbarButtonClass} onMouseDown={(e) => e.preventDefault()} onClick={() => insertEditorCommand("removeFormat")}>
                  <FaEraser className="text-[11px]" />
                </button>
              </div>

              <div className="flex items-center gap-1 rounded-md bg-white p-0.5">
                <button type="button" title="Undo" className={toolbarButtonClass} onMouseDown={(e) => e.preventDefault()} onClick={() => insertEditorCommand("undo")}>
                  <FaUndo className="text-[11px]" />
                </button>
                <button type="button" title="Redo" className={toolbarButtonClass} onMouseDown={(e) => e.preventDefault()} onClick={() => insertEditorCommand("redo")}>
                  <FaRedo className="text-[11px]" />
                </button>
              </div>
            </div>
            <div
              ref={editorRef}
              contentEditable
              suppressContentEditableWarning
              onInput={(event) => setContent(event.currentTarget.innerHTML)}
              onMouseUp={saveSelection}
              onKeyUp={saveSelection}
              className="min-h-[180px] w-full rounded-lg border border-[var(--color-border-secondary)] bg-white px-3 py-2 text-sm text-[var(--color-text-primary)] focus:outline-none [&_ul]:list-disc [&_ul]:pl-5 [&_ul]:my-2 [&_ol]:list-decimal [&_ol]:pl-5 [&_ol]:my-2 [&_li]:my-1"
            />
            {linkEditorOpen ? (
              <div className="mt-2 flex flex-wrap items-center gap-2 rounded-lg border border-[var(--color-border-tertiary)] bg-[var(--color-background-secondary)] p-2">
                <input
                  value={linkUrl}
                  onChange={(e) => setLinkUrl(e.target.value)}
                  placeholder="https://example.com"
                  className="min-w-[220px] flex-1"
                />
                <Button type="button" onClick={applyLink}>Apply Link</Button>
                <Button type="button" variant="secondary" onClick={() => setLinkEditorOpen(false)}>Cancel</Button>
              </div>
            ) : null}
          </div>

          <div>
            <label>Attachments / Images</label>
            <div className="rounded-xl border border-dashed border-[var(--color-border-secondary)] bg-[var(--color-background-secondary)] px-3 py-3">
              <input type="file" multiple onChange={onAttachmentChange} disabled={uploadingAttachments} />
              <p className="mt-2 text-xs text-[var(--color-text-tertiary)]">
                {uploadingAttachments ? "Uploading..." : "Image uploads only (JPEG/WebP), auto-compressed for Firebase limits."}
              </p>
            </div>
            {attachments.length > 0 ? (
              <div className="mt-2 grid grid-cols-2 gap-2 rounded-lg border border-[var(--color-border-tertiary)] bg-white p-2 sm:grid-cols-3 md:grid-cols-4">
                {attachments.map((item) => (
                  <div key={item.url} className="relative overflow-hidden rounded-lg border border-[var(--color-border-tertiary)] bg-[var(--color-background-secondary)]">
                    {String(item.mimeType || "").startsWith("image/") ? (
                      <img
                        src={item.url}
                        alt={item.name}
                        className="h-24 w-full object-cover"
                      />
                    ) : (
                      <div className="flex h-24 w-full items-center justify-center text-[var(--color-text-tertiary)]">
                        <FaFileAlt className="text-xl" />
                      </div>
                    )}
                    <button
                      type="button"
                      aria-label={`Remove ${item.name}`}
                      onClick={() => removeAttachment(item.url)}
                      className="absolute right-1 top-1 inline-flex h-6 w-6 items-center justify-center rounded-full bg-black/65 text-white transition hover:bg-black/80"
                    >
                      <FaTimes className="text-[10px]" />
                    </button>
                    <div className="px-2 py-1.5 text-[10px] text-[var(--color-text-secondary)]">
                      <p className="truncate" title={item.name}>{item.name}</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : null}
          </div>

          <div className="flex gap-2">
            <Button type="submit" disabled={submitting}>
              {submitting ? (editingAnnouncementId ? "Saving..." : "Posting...") : (editingAnnouncementId ? "Save Changes" : "Post Announcement")}
            </Button>
            <Button type="button" variant="secondary" onClick={() => { setCreateOpen(false); resetCreateForm(); }}>Cancel</Button>
          </div>
        </form>
      </Modal>

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
