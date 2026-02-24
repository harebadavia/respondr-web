import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { signInWithEmailAndPassword } from "firebase/auth";
import { auth } from "../firebase";
import { apiRequest } from "../services/api";
import { useAuth } from "../context/AuthContext";

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
      // 1️⃣ Firebase login
      const userCredential = await signInWithEmailAndPassword(
        auth,
        email,
        password
      );

      const firebaseUser = userCredential.user;

      // 2️⃣ Get ID token
      const token = await firebaseUser.getIdToken();

      // 3️⃣ Verify with backend
      const backendUser = await apiRequest("/auth/me", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      // 4️⃣ Store in context
      login({ firebaseUser, backendUser, token });

      // 5️⃣ Role-based redirect
      if (backendUser.role === "official") {
        navigate("/official");
      } else {
        navigate("/resident");
      }

    } catch (err) {
      console.error(err);
      setError("Invalid email or password");
    }
  };

  return (
    <div style={{ maxWidth: 400, margin: "100px auto" }}>
      <h2>Login to RESPONDR</h2>

      <form onSubmit={handleLogin}>
        <div>
          <label>Email</label>
          <input
            type="email"
            value={email}
            required
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>

        <div>
          <label>Password</label>
          <input
            type="password"
            value={password}
            required
            onChange={(e) => setPassword(e.target.value)}
          />
        </div>

        <button type="submit">Login</button>

        {error && <p style={{ color: "red" }}>{error}</p>}
      </form>
    </div>
  );
}