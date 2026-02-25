import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { signInWithEmailAndPassword } from "firebase/auth";
import { auth } from "../firebase";
import { apiRequest } from "../services/api";
import { useAuth } from "../context/AuthContext";
import Card from "../components/ui/Card";
import Button from "../components/ui/Button";
import Input from "../components/ui/Input";
import Alert from "../components/ui/Alert";
import PageContainer from "../components/ui/PageContainer";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const navigate = useNavigate();
  const { login } = useAuth();

  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");

    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const firebaseUser = userCredential.user;
      const token = await firebaseUser.getIdToken();

      const backendUser = await apiRequest("/auth/me", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      login({ firebaseUser, backendUser, token });

      if (backendUser.role === "admin") {
        navigate("/admin/dashboard");
      } else if (backendUser.role === "official") {
        navigate("/official/dashboard");
      } else {
        navigate("/resident/dashboard");
      }
    } catch (err) {
      console.error(err);
      setError("Invalid email or password");
    }
  };

  return (
    <PageContainer className="flex min-h-[70vh] items-center justify-center">
      <Card className="w-full max-w-md">
        <h2 className="mb-1 text-2xl font-bold text-neutral-900">Login to RESPONDR</h2>
        <p className="mb-5 text-sm text-neutral-600">Sign in to submit and track incidents.</p>

        <form onSubmit={handleLogin} className="space-y-3">
          <Input type="email" label="Email" value={email} required onChange={(e) => setEmail(e.target.value)} />
          <Input type="password" label="Password" value={password} required onChange={(e) => setPassword(e.target.value)} />

          <Button type="submit" className="w-full">Login</Button>

          {error && <Alert tone="error">{error}</Alert>}
        </form>

        <p className="mt-4 text-sm text-neutral-700">
          No account yet? <Link to="/register">Register</Link>
        </p>
      </Card>
    </PageContainer>
  );
}
