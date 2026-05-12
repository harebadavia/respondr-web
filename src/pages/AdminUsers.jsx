import { useCallback, useEffect, useMemo, useState } from "react";
import { apiAuthRequest } from "../services/api";
import Button from "../components/ui/Button";
import Input from "../components/ui/Input";
import Modal from "../components/ui/Modal";
import ToastStack from "../components/ui/ToastStack";
import RolePageHeader from "../components/ui/RolePageHeader";
import { ListToolbar, Pagination } from "../components/ui/ListControls";
import { paginateItems } from "../components/ui/listControlUtils";
import { FaUsersGear } from "react-icons/fa6";

const ROLE_OPTIONS = ["resident", "official", "admin"];
const ROLE_COLORS = {
  admin: { bg: "#EEEDFE", text: "#534AB7" },
  official: { bg: "#E6F1FB", text: "#185FA5" },
  resident: { bg: "#EAF3DE", text: "#3B6D11" },
};
const CARD_STYLE = {
  background: "#FFFFFF",
  border: "1px solid #DDE4EE",
  borderRadius: 16,
  padding: "22px 24px",
  overflow: "hidden",
  boxShadow: "0 4px 14px rgba(15, 23, 42, 0.06)",
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

function prettyRole(role) {
  return String(role || "").replace("_", " ");
}

function SectionLabel({ children }) {
  return (
    <p style={{
      margin: "0 0 12px",
      fontSize: 11,
      fontWeight: 700,
      color: "var(--color-text-tertiary)",
      letterSpacing: "0.08em",
      textTransform: "uppercase",
    }}>
      {children}
    </p>
  );
}

function UsersHeader({ onAddUser }) {
  return (
    <RolePageHeader
      title="Users"
      subtitle="Manage user profile, role, and account activation status."
      role="admin"
      icon={FaUsersGear}
      right={(
        <div style={{ flexShrink: 0 }}>
          <Button onClick={onAddUser}>Add User</Button>
        </div>
      )}
    />
  );
}

export default function AdminUsers() {
  const [users, setUsers] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
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

  const filteredUsers = useMemo(() => {
    const query = searchTerm.trim().toLowerCase();
    return users.filter((user) => {
      const role = String(user.role || "").toLowerCase();
      if (roleFilter !== "all" && role !== roleFilter) return false;
      if (statusFilter === "active" && !user.is_active) return false;
      if (statusFilter === "inactive" && user.is_active) return false;
      if (!query) return true;
      return [
        user.first_name,
        user.last_name,
        `${user.first_name || ""} ${user.last_name || ""}`,
        user.email,
        user.phone_number,
        user.role,
        user.is_active ? "active" : "inactive",
      ].join(" ").toLowerCase().includes(query);
    });
  }, [roleFilter, searchTerm, statusFilter, users]);

  useEffect(() => {
    setPage(1);
  }, [searchTerm, roleFilter, statusFilter, pageSize]);

  const pagination = paginateItems(filteredUsers, page, pageSize);

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
    <section className="space-y-4">
      <ToastStack toasts={toasts} onDismiss={dismissToast} />
      <UsersHeader onAddUser={openCreateModal} />

      <ListToolbar
        searchValue={searchTerm}
        onSearchChange={setSearchTerm}
        searchPlaceholder="Search users"
        filters={[
          {
            id: "role",
            label: "Role",
            value: roleFilter,
            onChange: setRoleFilter,
            options: [
              { value: "all", label: "All roles" },
              ...ROLE_OPTIONS.map((role) => ({ value: role, label: prettyRole(role) })),
            ],
          },
          {
            id: "status",
            label: "Status",
            value: statusFilter,
            onChange: setStatusFilter,
            options: [
              { value: "all", label: "All statuses" },
              { value: "active", label: "Active" },
              { value: "inactive", label: "Inactive" },
            ],
          },
        ]}
        pageSize={pageSize}
        onPageSizeChange={setPageSize}
      />

      <div style={{ marginTop: 22 }}>
        {loading ? (
          <div style={CARD_STYLE}><p className="text-neutral-600">Loading users...</p></div>
        ) : users.length === 0 ? (
          <div style={CARD_STYLE}><p className="text-neutral-600">No users found.</p></div>
        ) : filteredUsers.length === 0 ? (
          <div style={CARD_STYLE}><p className="text-neutral-600">No users match your search.</p></div>
        ) : (
          <div style={CARD_STYLE}>
            <SectionLabel>User Directory</SectionLabel>
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                  <thead>
                    <tr>
                      <th style={thStyle}>Name</th>
                      <th style={thStyle}>Email</th>
                      <th style={thStyle}>Role</th>
                      <th style={thStyle}>Status</th>
                      <th style={thStyle}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {pagination.pageItems.map((user) => {
                      const role = String(user.role || "").toLowerCase();
                      const roleColor = ROLE_COLORS[role] || { bg: "#F1EFE8", text: "#5F5E5A" };

                      return (
                        <tr key={user.id}>
                          <td style={tdStyle}>{user.first_name} {user.last_name}</td>
                          <td style={{ ...tdStyle, color: "var(--color-text-secondary)" }}>{user.email}</td>
                          <td style={tdStyle}>
                            <span style={{
                              padding: "2px 9px",
                              borderRadius: 999,
                              fontSize: 11,
                              fontWeight: 600,
                              background: roleColor.bg,
                              color: roleColor.text,
                              textTransform: "capitalize",
                              letterSpacing: "0.02em",
                            }}>
                              {prettyRole(user.role)}
                            </span>
                          </td>
                          <td style={tdStyle}>
                            <span style={{
                              padding: "2px 9px",
                              borderRadius: 999,
                              fontSize: 11,
                              fontWeight: 600,
                              letterSpacing: "0.03em",
                              textTransform: "uppercase",
                              background: user.is_active ? "#EAF3DE" : "#F1EFE8",
                              color: user.is_active ? "#3B6D11" : "#5F5E5A",
                            }}>
                              {user.is_active ? "active" : "inactive"}
                            </span>
                          </td>
                          <td style={tdStyle}>
                            <div className="flex flex-wrap gap-2">
                              <Button type="button" variant="secondary" onClick={() => openViewModal(user)}>View</Button>
                              <Button type="button" onClick={() => openEditModal(user)}>Edit</Button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {!loading && filteredUsers.length > 0 && (
        <Pagination
          page={pagination.safePage}
          totalPages={pagination.totalPages}
          totalItems={filteredUsers.length}
          start={pagination.start}
          end={pagination.end}
          onPageChange={setPage}
        />
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
    </section>
  );
}
