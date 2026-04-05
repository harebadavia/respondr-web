import { useEffect, useMemo, useState } from "react";
import { apiAuthRequest } from "../services/api";
import Card from "../components/ui/Card";
import Alert from "../components/ui/Alert";
import Button from "../components/ui/Button";
import PageContainer from "../components/ui/PageContainer";
import RolePageHeader from "../components/ui/RolePageHeader";

const ROLE_OPTIONS = ["resident", "official", "admin"];

export default function AdminUsers() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [savingUserId, setSavingUserId] = useState(null);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const editableUsers = useMemo(
    () => users.map((user) => ({ ...user, draft_role: user.role, draft_is_active: Boolean(user.is_active) })),
    [users]
  );

  const [drafts, setDrafts] = useState([]);

  useEffect(() => {
    setDrafts(editableUsers);
  }, [editableUsers]);

  const loadUsers = async () => {
    setLoading(true);
    setError("");
    try {
      const data = await apiAuthRequest("/users?limit=300");
      setUsers(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err.message || "Failed to load users");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUsers();
  }, []);

  const updateDraft = (id, updates) => {
    setDrafts((prev) =>
      prev.map((user) => (user.id === id ? { ...user, ...updates } : user))
    );
  };

  const saveUser = async (id) => {
    const current = users.find((item) => item.id === id);
    const draft = drafts.find((item) => item.id === id);
    if (!current || !draft) return;

    const payload = {};
    if (draft.draft_role !== current.role) payload.role = draft.draft_role;
    if (Boolean(draft.draft_is_active) !== Boolean(current.is_active)) payload.is_active = Boolean(draft.draft_is_active);

    if (Object.keys(payload).length === 0) return;

    setSavingUserId(id);
    setError("");
    setMessage("");

    try {
      const updated = await apiAuthRequest(`/users/${id}`, {
        method: "PUT",
        body: JSON.stringify(payload),
      });

      setUsers((prev) => prev.map((user) => (user.id === id ? updated : user)));
      setMessage("User updated successfully.");
    } catch (err) {
      setError(err.message || "Failed to update user");
    } finally {
      setSavingUserId(null);
    }
  };

  return (
    <PageContainer className="space-y-4 !max-w-none px-0 py-0">
      <RolePageHeader
        role="admin"
        title="Admin Users"
        subtitle="Manage user role and account activation status."
      />

      {error && <Alert tone="error">{error}</Alert>}
      {message && <Alert tone="success">{message}</Alert>}

      {loading ? (
        <Card><p className="text-neutral-600">Loading users...</p></Card>
      ) : drafts.length === 0 ? (
        <Card><p className="text-neutral-600">No users found.</p></Card>
      ) : (
        <Card>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-neutral-200 text-sm">
              <thead>
                <tr className="text-left text-neutral-600">
                  <th className="px-3 py-2 font-semibold">Name</th>
                  <th className="px-3 py-2 font-semibold">Email</th>
                  <th className="px-3 py-2 font-semibold">Role</th>
                  <th className="px-3 py-2 font-semibold">Active</th>
                  <th className="px-3 py-2 font-semibold">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100">
                {drafts.map((user) => {
                  const hasChanges = user.draft_role !== user.role || Boolean(user.draft_is_active) !== Boolean(user.is_active);
                  const isSaving = savingUserId === user.id;

                  return (
                    <tr key={user.id}>
                      <td className="px-3 py-2 text-neutral-800">{user.first_name} {user.last_name}</td>
                      <td className="px-3 py-2 text-neutral-700">{user.email}</td>
                      <td className="px-3 py-2">
                        <select
                          value={user.draft_role}
                          onChange={(event) => updateDraft(user.id, { draft_role: event.target.value })}
                          className="w-full rounded-md border border-neutral-300 bg-white px-3 py-2 text-sm"
                        >
                          {ROLE_OPTIONS.map((role) => (
                            <option key={role} value={role}>{role}</option>
                          ))}
                        </select>
                      </td>
                      <td className="px-3 py-2">
                        <select
                          value={user.draft_is_active ? "true" : "false"}
                          onChange={(event) => updateDraft(user.id, { draft_is_active: event.target.value === "true" })}
                          className="w-full rounded-md border border-neutral-300 bg-white px-3 py-2 text-sm"
                        >
                          <option value="true">Active</option>
                          <option value="false">Inactive</option>
                        </select>
                      </td>
                      <td className="px-3 py-2">
                        <Button
                          type="button"
                          disabled={!hasChanges || isSaving}
                          onClick={() => saveUser(user.id)}
                        >
                          {isSaving ? "Saving..." : "Save"}
                        </Button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </PageContainer>
  );
}
