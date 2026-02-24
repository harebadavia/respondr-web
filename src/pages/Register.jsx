import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { auth } from "../firebase";
import { apiRequest } from "../services/api";
import { useAuth } from "../context/AuthContext";

export default function Register() {
  const navigate = useNavigate();
  const { login } = useAuth();

  const [form, setForm] = useState({
    first_name: "",
    last_name: "",
    phone_number: "",
    email: "",
    password: "",
  });

  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const onChange = (e) => {
    setForm((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setError("");
    setSubmitting(true);

    try {
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        form.email,
        form.password
      );

      const firebaseUser = userCredential.user;
      const token = await firebaseUser.getIdToken();

      const backendUser = await apiRequest("/auth/register", {
        method: "POST",
        body: JSON.stringify({
          firebase_uid: firebaseUser.uid,
          email: firebaseUser.email,
          first_name: form.first_name.trim(),
          last_name: form.last_name.trim(),
          phone_number: form.phone_number.trim() || null,
        }),
      });

      login({ firebaseUser, backendUser, token });
      navigate("/resident/dashboard");
    } catch (err) {
      console.error(err);
      setError(err.message || "Registration failed. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div style={{ maxWidth: 420, margin: "80px auto" }}>
      <h2>Create your RESPONDR account</h2>

      <form onSubmit={handleRegister}>
        <div style={{ marginBottom: 12 }}>
          <label>First name</label>
          <input
            name="first_name"
            value={form.first_name}
            onChange={onChange}
            required
            placeholder="Juan"
          />
        </div>

        <div style={{ marginBottom: 12 }}>
          <label>Last name</label>
          <input
            name="last_name"
            value={form.last_name}
            onChange={onChange}
            required
            placeholder="Dela Cruz"
          />
        </div>

        <div style={{ marginBottom: 12 }}>
          <label>Phone number (optional)</label>
          <input
            name="phone_number"
            value={form.phone_number}
            onChange={onChange}
            placeholder="09xxxxxxxxx"
          />
        </div>

        <div style={{ marginBottom: 12 }}>
          <label>Email</label>
          <input
            type="email"
            name="email"
            value={form.email}
            onChange={onChange}
            required
            placeholder="email@example.com"
          />
        </div>

        <div style={{ marginBottom: 12 }}>
          <label>Password</label>
          <input
            type="password"
            name="password"
            value={form.password}
            onChange={onChange}
            required
            placeholder="Min 6 characters"
          />
        </div>

        <button type="submit" disabled={submitting}>
          {submitting ? "Creating account..." : "Register"}
        </button>

        {error && <p style={{ color: "red", marginTop: 10 }}>{error}</p>}
      </form>

      <p style={{ marginTop: 16 }}>
        Already have an account? <Link to="/">Login</Link>
      </p>
    </div>
  );
}
