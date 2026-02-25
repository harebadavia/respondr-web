import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { auth } from "../firebase";
import { apiRequest } from "../services/api";
import { useAuth } from "../context/AuthContext";
import Card from "../components/ui/Card";
import Button from "../components/ui/Button";
import Input from "../components/ui/Input";
import Alert from "../components/ui/Alert";
import PageContainer from "../components/ui/PageContainer";

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
      const userCredential = await createUserWithEmailAndPassword(auth, form.email, form.password);
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
    <PageContainer className="flex min-h-[75vh] items-center justify-center">
      <Card className="w-full max-w-lg">
        <h2 className="mb-1 text-2xl font-bold text-neutral-900">Create your RESPONDR account</h2>
        <p className="mb-5 text-sm text-neutral-600">Resident self-registration for incident reporting.</p>

        <form onSubmit={handleRegister} className="grid gap-3">
          <div className="grid gap-3 md:grid-cols-2">
            <Input name="first_name" label="First name" value={form.first_name} onChange={onChange} required placeholder="Juan" />
            <Input name="last_name" label="Last name" value={form.last_name} onChange={onChange} required placeholder="Dela Cruz" />
          </div>

          <Input name="phone_number" label="Phone number (optional)" value={form.phone_number} onChange={onChange} placeholder="09xxxxxxxxx" />
          <Input type="email" name="email" label="Email" value={form.email} onChange={onChange} required placeholder="email@example.com" />
          <Input type="password" name="password" label="Password" value={form.password} onChange={onChange} required placeholder="Min 6 characters" />

          <Button type="submit" className="w-full" disabled={submitting}>
            {submitting ? "Creating account..." : "Register"}
          </Button>

          {error && <Alert tone="error">{error}</Alert>}
        </form>

        <p className="mt-4 text-sm text-neutral-700">
          Already have an account? <Link to="/">Login</Link>
        </p>
      </Card>
    </PageContainer>
  );
}
