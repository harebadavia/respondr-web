import { useCallback, useEffect, useState } from "react";
import { apiAuthRequest } from "../services/api";
import Card from "../components/ui/Card";
import Button from "../components/ui/Button";
import Input from "../components/ui/Input";
import Modal from "../components/ui/Modal";
import PageContainer from "../components/ui/PageContainer";
import RolePageHeader from "../components/ui/RolePageHeader";
import ToastStack from "../components/ui/ToastStack";

const ROLE_OPTIONS = ["resident", "official", "admin"];

function prettyRole(role) {
  return String(role || "").replace("_", " ");
}

export default function AdminUsers() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [toasts, setToasts] = useState([]);

  const [createOpen, setCreateOpen] = useState(false);
  const [creating, setCreating] = useState(false);
  const [createForm, setCreateForm] = useState({
    email: "",
    password: "",
    first_name: "",
    last_name: "",
    phone_number: "",
    role: "resident",
    is_active: "true",
  });

  const [viewOpen, setViewOpen] = useState(false);
  const [viewUser, setViewUser] = useState(null);

  const [editOpen, setEditOpen] = useState(false);
  const [editing, setEditing] = useState(false);
  const [editUserId, setEditUserId] = useState(null);
  const [editForm, setEditForm] = useState({
    first_name: "",
    last_name: "",
    phone_number: "",
    role: "resident",
    is_active: "true",
  });

  const pushToast = useCallback((tone, message, durationMs = 4500) => {
    setToasts((prev) => [
      ...prev,
      { id: `${Date.now()}-${Math.random().toString(36).slice(2)}`, tone, message, durationMs },
    ]);
  }, []);

  const dismissToast = useCallback((id) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  }, []);

  const loadUsers = useCallback(async () => {
    setLoading(true);
    try {
      const data = await apiAuthRequest("/users?limit=300");
      setUsers(Array.isArray(data) ? data : []);
    } catch (err) {
      pushToast("error", err.message || "Failed to load users");
    } finally {
      setLoading(false);
    }
  }, [pushToast]);

  useEffect(() => {
    loadUsers();
  }, [loadUsers]);

  const onCreateChange = (event) => {
    const { name, value } = event.target;
    setCreateForm((prev) => ({ ...prev, [name]: value }));
  };

  const onEditChange = (event) => {
    const { name, value } = event.target;
    setEditForm((prev) => ({ ...prev, [name]: value }));
  };

  const openCreateModal = () => {
    setCreateForm({
      email: "",
      password: "",
      first_name: "",
      last_name: "",
      phone_number: "",
      role: "resident",
      is_active: "true",
    });
    setCreateOpen(true);
  };

  const openViewModal = (user) => {
    setViewUser(user);
    setViewOpen(true);
  };

  const openEditModal = (user) => {
    setEditUserId(user.id);
    setEditForm({
      first_name: user.first_name || "",
      last_name: user.last_name || "",
      phone_number: user.phone_number || "",
      role: user.role || "resident",
      is_active: user.is_active ? "true" : "false",
    });
    setEditOpen(true);
  };

  const handleCreateUser = async (event) => {
    event.preventDefault();
    setCreating(true);

    try {
      const payload = {
        email: createForm.email.trim().toLowerCase(),
        password: createForm.password,
        first_name: createForm.first_name.trim(),
        last_name: createForm.last_name.trim(),
        phone_number: createForm.phone_number.trim() || null,
        role: createForm.role,
        is_active: createForm.is_active === "true",
      };

      if (!payload.email || !payload.password || !payload.first_name || !payload.last_name) {
        throw new Error("Email, password, first name, and last name are required.");
      }

      await apiAuthRequest("/users", {
        method: "POST",
        body: JSON.stringify(payload),
      });

      setCreateOpen(false);
      pushToast("success", "User created successfully.");
      await loadUsers();
    } catch (err) {
      const text = String(err.message || "");
      if (text.toLowerCase().includes("not found")) {
        pushToast("error", "Create user endpoint not found. Please restart backend and ensure latest routes are loaded.");
      } else {
        pushToast("error", text || "Failed to create user");
      }
    } finally {
      setCreating(false);
    }
  };

  const handleEditUser = async (event) => {
    event.preventDefault();
    if (!editUserId) return;

    setEditing(true);

    try {
      const payload = {
        first_name: editForm.first_name.trim(),
        last_name: editForm.last_name.trim(),
        phone_number: editForm.phone_number.trim() || null,
        role: editForm.role,
        is_active: editForm.is_active === "true",
      };

      if (!payload.first_name || !payload.last_name) {
        throw new Error("First name and last name are required.");
      }

      await apiAuthRequest(`/users/${editUserId}`, {
        method: "PUT",
        body: JSON.stringify(payload),
      });

      setEditOpen(false);
      pushToast("success", "User updated successfully.");
      await loadUsers();
    } catch (err) {
      pushToast("error", err.message || "Failed to update user");
    } finally {
      setEditing(false);
    }
  };

  return (
    <PageContainer className="space-y-4 !max-w-none px-0 py-0">
      <ToastStack toasts={toasts} onDismiss={dismissToast} />
      <RolePageHeader
        role="admin"
        title="Admin Users"
        subtitle="Manage user profile, role, and account activation status."
        right={<Button onClick={openCreateModal}>Add User</Button>}
      />

      {loading ? (
        <Card><p className="text-neutral-600">Loading users...</p></Card>
      ) : users.length === 0 ? (
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
                  <th className="px-3 py-2 font-semibold">Status</th>
                  <th className="px-3 py-2 font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100">
                {users.map((user) => (
                  <tr key={user.id}>
                    <td className="px-3 py-2 text-neutral-800">{user.first_name} {user.last_name}</td>
                    <td className="px-3 py-2 text-neutral-700">{user.email}</td>
                    <td className="px-3 py-2">
                      <span className="rounded-full bg-neutral-100 px-2.5 py-1 text-xs font-semibold uppercase tracking-wide text-neutral-700">
                        {prettyRole(user.role)}
                      </span>
                    </td>
                    <td className="px-3 py-2">
                      <span className={`rounded-full px-2.5 py-1 text-xs font-semibold uppercase tracking-wide ${user.is_active ? "bg-emerald-100 text-emerald-800" : "bg-neutral-200 text-neutral-700"}`}>
                        {user.is_active ? "active" : "inactive"}
                      </span>
                    </td>
                    <td className="px-3 py-2">
                      <div className="flex flex-wrap gap-2">
                        <Button type="button" variant="secondary" onClick={() => openViewModal(user)}>View</Button>
                        <Button type="button" onClick={() => openEditModal(user)}>Edit</Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      <Modal open={createOpen} onClose={() => setCreateOpen(false)} title="Add User">
        <form onSubmit={handleCreateUser} className="space-y-3">
          <Input name="email" label="Email" value={createForm.email} onChange={onCreateChange} required />
          <Input name="password" label="Password" type="password" value={createForm.password} onChange={onCreateChange} required />
          <div className="grid gap-3 md:grid-cols-2">
            <Input name="first_name" label="First Name" value={createForm.first_name} onChange={onCreateChange} required />
            <Input name="last_name" label="Last Name" value={createForm.last_name} onChange={onCreateChange} required />
          </div>
          <Input name="phone_number" label="Phone Number" value={createForm.phone_number} onChange={onCreateChange} />
          <div className="grid gap-3 md:grid-cols-2">
            <div>
              <label>Role</label>
              <select
                name="role"
                value={createForm.role}
                onChange={onCreateChange}
                className="w-full rounded-md border border-neutral-300 bg-white px-3 py-2 text-sm"
              >
                {ROLE_OPTIONS.map((role) => (
                  <option key={role} value={role}>{role}</option>
                ))}
              </select>
            </div>
            <div>
              <label>Status</label>
              <select
                name="is_active"
                value={createForm.is_active}
                onChange={onCreateChange}
                className="w-full rounded-md border border-neutral-300 bg-white px-3 py-2 text-sm"
              >
                <option value="true">Active</option>
                <option value="false">Inactive</option>
              </select>
            </div>
          </div>
          <div className="flex flex-wrap gap-2 pt-1">
            <Button type="submit" disabled={creating}>{creating ? "Creating..." : "Create User"}</Button>
            <Button type="button" variant="secondary" onClick={() => setCreateOpen(false)}>Cancel</Button>
          </div>
        </form>
      </Modal>

      <Modal open={viewOpen} onClose={() => setViewOpen(false)} title="User Details">
        {viewUser ? (
          <div className="space-y-2 text-sm">
            <p><span className="font-semibold text-neutral-700">Name:</span> {viewUser.first_name} {viewUser.last_name}</p>
            <p><span className="font-semibold text-neutral-700">Email:</span> {viewUser.email}</p>
            <p><span className="font-semibold text-neutral-700">Phone:</span> {viewUser.phone_number || "N/A"}</p>
            <p><span className="font-semibold text-neutral-700">Role:</span> {prettyRole(viewUser.role)}</p>
            <p><span className="font-semibold text-neutral-700">Status:</span> {viewUser.is_active ? "Active" : "Inactive"}</p>
            <p><span className="font-semibold text-neutral-700">Firebase UID:</span> {viewUser.firebase_uid}</p>
            <p><span className="font-semibold text-neutral-700">Created:</span> {new Date(viewUser.created_at).toLocaleString()}</p>
          </div>
        ) : null}
      </Modal>

      <Modal open={editOpen} onClose={() => setEditOpen(false)} title="Edit User">
        <form onSubmit={handleEditUser} className="space-y-3">
          <div className="grid gap-3 md:grid-cols-2">
            <Input name="first_name" label="First Name" value={editForm.first_name} onChange={onEditChange} required />
            <Input name="last_name" label="Last Name" value={editForm.last_name} onChange={onEditChange} required />
          </div>
          <Input name="phone_number" label="Phone Number" value={editForm.phone_number} onChange={onEditChange} />
          <div className="grid gap-3 md:grid-cols-2">
            <div>
              <label>Role</label>
              <select
                name="role"
                value={editForm.role}
                onChange={onEditChange}
                className="w-full rounded-md border border-neutral-300 bg-white px-3 py-2 text-sm"
              >
                {ROLE_OPTIONS.map((role) => (
                  <option key={role} value={role}>{role}</option>
                ))}
              </select>
            </div>
            <div>
              <label>Status</label>
              <select
                name="is_active"
                value={editForm.is_active}
                onChange={onEditChange}
                className="w-full rounded-md border border-neutral-300 bg-white px-3 py-2 text-sm"
              >
                <option value="true">Active</option>
                <option value="false">Inactive</option>
              </select>
            </div>
          </div>
          <div className="flex flex-wrap gap-2 pt-1">
            <Button type="submit" disabled={editing}>{editing ? "Saving..." : "Save Changes"}</Button>
            <Button type="button" variant="secondary" onClick={() => setEditOpen(false)}>Cancel</Button>
          </div>
        </form>
      </Modal>
    </PageContainer>
  );
}
