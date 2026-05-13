import { useEffect, useState } from "react";
import {
  EmailAuthProvider,
  reauthenticateWithCredential,
  updatePassword,
} from "firebase/auth";
import { useAuth } from "../context/AuthContext";
import { auth } from "../firebase";
import { apiAuthRequest } from "../services/api";
import Alert from "../components/ui/Alert";
import Button from "../components/ui/Button";
import Card from "../components/ui/Card";
import Input from "../components/ui/Input";
import RolePageHeader from "../components/ui/RolePageHeader";
import { FaUser } from "react-icons/fa6";

export default function Profile() {
  const { backendUser, updateBackendUser } = useAuth();
  const [profileForm, setProfileForm] = useState({
    first_name: "",
    last_name: "",
    phone_number: "",
  });
  const [profileSaving, setProfileSaving] = useState(false);
  const [profileError, setProfileError] = useState("");
  const [profileMessage, setProfileMessage] = useState("");
  const [passwordForm, setPasswordForm] = useState({
    current_password: "",
    new_password: "",
    confirm_password: "",
  });
  const [passwordSaving, setPasswordSaving] = useState(false);
  const [passwordError, setPasswordError] = useState("");
  const [passwordMessage, setPasswordMessage] = useState("");

  useEffect(() => {
    setProfileForm({
      first_name: backendUser?.first_name || "",
      last_name: backendUser?.last_name || "",
      phone_number: backendUser?.phone_number || "",
    });
  }, [backendUser]);

  const initials = `${backendUser?.first_name?.[0] || ""}${backendUser?.last_name?.[0] || ""}`
    .toUpperCase()
    .slice(0, 2) || "U";

  const onProfileChange = (event) => {
    const { name, value } = event.target;
    setProfileForm((current) => ({ ...current, [name]: value }));
  };

  const onPasswordChange = (event) => {
    const { name, value } = event.target;
    setPasswordForm((current) => ({ ...current, [name]: value }));
  };

  const saveProfile = async (event) => {
    event.preventDefault();
    setProfileError("");
    setProfileMessage("");

    const payload = {
      first_name: profileForm.first_name.trim(),
      last_name: profileForm.last_name.trim(),
      phone_number: profileForm.phone_number.trim() || null,
    };

    if (!payload.first_name || !payload.last_name) {
      setProfileError("First name and last name are required.");
      return;
    }

    setProfileSaving(true);
    try {
      const updatedUser = await apiAuthRequest("/auth/me", {
        method: "PATCH",
        body: JSON.stringify(payload),
      });
      updateBackendUser(updatedUser);
      setProfileForm({
        first_name: updatedUser.first_name || "",
        last_name: updatedUser.last_name || "",
        phone_number: updatedUser.phone_number || "",
      });
      setProfileMessage("Profile updated successfully.");
    } catch (err) {
      setProfileError(err.message || "Failed to update profile.");
    } finally {
      setProfileSaving(false);
    }
  };

  const savePassword = async (event) => {
    event.preventDefault();
    setPasswordError("");
    setPasswordMessage("");

    const currentPassword = passwordForm.current_password;
    const newPassword = passwordForm.new_password;
    const confirmPassword = passwordForm.confirm_password;

    if (!currentPassword || !newPassword || !confirmPassword) {
      setPasswordError("Current password, new password, and confirmation are required.");
      return;
    }

    if (newPassword.length < 6) {
      setPasswordError("New password must be at least 6 characters.");
      return;
    }

    if (newPassword !== confirmPassword) {
      setPasswordError("New password and confirmation do not match.");
      return;
    }

    if (!auth.currentUser?.email) {
      setPasswordError("Unable to confirm your current session. Please sign in again.");
      return;
    }

    setPasswordSaving(true);
    try {
      const credential = EmailAuthProvider.credential(auth.currentUser.email, currentPassword);
      await reauthenticateWithCredential(auth.currentUser, credential);
      await updatePassword(auth.currentUser, newPassword);
      setPasswordForm({
        current_password: "",
        new_password: "",
        confirm_password: "",
      });
      setPasswordMessage("Password updated successfully.");
    } catch (err) {
      const code = err?.code || "";
      if (code === "auth/invalid-credential" || code === "auth/wrong-password") {
        setPasswordError("Current password is incorrect.");
      } else if (code === "auth/weak-password") {
        setPasswordError("New password is too weak.");
      } else if (code === "auth/requires-recent-login") {
        setPasswordError("Please sign in again before changing your password.");
      } else {
        setPasswordError(err.message || "Failed to update password.");
      }
    } finally {
      setPasswordSaving(false);
    }
  };

  return (
    <section className="space-y-4">
      <RolePageHeader
        role={backendUser?.role || "resident"}
        title="Profile"
        subtitle="Account details, contact information, and password."
        icon={FaUser}
      />

      <Card className="w-full">
        <div className="flex items-center gap-4">
          <div className="flex h-16 w-16 items-center justify-center rounded-full border border-neutral-200 bg-brand-50 text-xl font-bold text-brand-700">
            {initials}
          </div>
          <div>
            <p className="text-xl font-semibold text-neutral-900">
              {backendUser?.first_name} {backendUser?.last_name}
            </p>
            <p className="text-sm text-neutral-600">{backendUser?.email}</p>
            <p className="mt-1 text-xs font-semibold uppercase tracking-wide text-neutral-500">{backendUser?.role}</p>
          </div>
        </div>
      </Card>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <form className="space-y-4" onSubmit={saveProfile}>
            <div>
              <h2 className="text-base font-semibold text-neutral-900">Personal information</h2>
              <p className="mt-1 text-sm text-neutral-600">
                Update the name and phone number shown across RESPONDR.
              </p>
            </div>

            {profileError && <Alert tone="error">{profileError}</Alert>}
            {profileMessage && <Alert tone="success">{profileMessage}</Alert>}

            <div className="grid gap-3 sm:grid-cols-2">
              <Input
                name="first_name"
                label="First name"
                value={profileForm.first_name}
                onChange={onProfileChange}
                required
              />
              <Input
                name="last_name"
                label="Last name"
                value={profileForm.last_name}
                onChange={onProfileChange}
                required
              />
            </div>

            <Input
              name="email"
              label="Email"
              value={backendUser?.email || ""}
              disabled
              readOnly
            />

            <Input
              name="phone_number"
              label="Phone number"
              value={profileForm.phone_number}
              onChange={onProfileChange}
              placeholder="09xxxxxxxxx"
            />

            <div className="flex justify-end">
              <Button type="submit" disabled={profileSaving}>
                {profileSaving ? "Saving..." : "Save profile"}
              </Button>
            </div>
          </form>
        </Card>

        <Card>
          <form className="space-y-4" onSubmit={savePassword}>
            <div>
              <h2 className="text-base font-semibold text-neutral-900">Password</h2>
              <p className="mt-1 text-sm text-neutral-600">
                Confirm your current password before setting a new one.
              </p>
            </div>

            {passwordError && <Alert tone="error">{passwordError}</Alert>}
            {passwordMessage && <Alert tone="success">{passwordMessage}</Alert>}

            <Input
              type="password"
              name="current_password"
              label="Current password"
              value={passwordForm.current_password}
              onChange={onPasswordChange}
              autoComplete="current-password"
              required
            />
            <Input
              type="password"
              name="new_password"
              label="New password"
              value={passwordForm.new_password}
              onChange={onPasswordChange}
              autoComplete="new-password"
              required
            />
            <Input
              type="password"
              name="confirm_password"
              label="Confirm new password"
              value={passwordForm.confirm_password}
              onChange={onPasswordChange}
              autoComplete="new-password"
              required
            />

            <div className="flex justify-end">
              <Button type="submit" disabled={passwordSaving}>
                {passwordSaving ? "Updating..." : "Update password"}
              </Button>
            </div>
          </form>
        </Card>
      </div>
    </section>
  );
}
