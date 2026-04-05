import { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { apiAuthRequest } from "../services/api";
import Card from "../components/ui/Card";
import Alert from "../components/ui/Alert";
import Button from "../components/ui/Button";
import Input from "../components/ui/Input";
import Textarea from "../components/ui/Textarea";
import RolePageHeader from "../components/ui/RolePageHeader";

export default function OfficialAnnouncements() {
  const { isAuthenticated } = useAuth();

  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [announcements, setAnnouncements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

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

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSubmitting(true);
    setError("");
    setMessage("");

    try {
      if (!title.trim() || !content.trim()) {
        throw new Error("Title and content are required.");
      }

      await apiAuthRequest("/announcements", {
        method: "POST",
        body: JSON.stringify({ title: title.trim(), content: content.trim() }),
      });

      setTitle("");
      setContent("");
      setMessage("Announcement posted.");
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
      />

      {error && <Alert tone="error">{error}</Alert>}
      {message && <Alert tone="success">{message}</Alert>}

      <Card>
        <form onSubmit={handleSubmit} className="space-y-3">
          <Input label="Title" value={title} onChange={(e) => setTitle(e.target.value)} required />
          <Textarea label="Content" rows={4} value={content} onChange={(e) => setContent(e.target.value)} required />
          <Button type="submit" disabled={submitting}>{submitting ? "Posting..." : "Post Announcement"}</Button>
        </form>
      </Card>

      {loading ? (
        <Card><p className="text-neutral-600">Loading announcements...</p></Card>
      ) : announcements.length === 0 ? (
        <Card><p className="text-neutral-600">No announcements yet.</p></Card>
      ) : (
        <div className="space-y-3">
          {announcements.map((item) => (
            <Card key={item.id}>
              <h3 className="text-lg font-semibold text-neutral-900">{item.title}</h3>
              <p className="mt-2 text-sm text-neutral-700">{item.content}</p>
              <p className="mt-2 text-xs text-neutral-500">{new Date(item.created_at).toLocaleString()}</p>
            </Card>
          ))}
        </div>
      )}
    </section>
  );
}
