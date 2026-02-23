import { createContext, useContext, useState, useEffect } from "react";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { auth } from "../firebase";
import { apiRequest } from "../services/api";

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [firebaseUser, setFirebaseUser] = useState(null);
  const [backendUser, setBackendUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);

  // 🔥 Auto-login on refresh
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        try {
          const newToken = await user.getIdToken();

          const backendUser = await apiRequest("/auth/me", {
            headers: {
              Authorization: `Bearer ${newToken}`,
            },
          });

          setFirebaseUser(user);
          setBackendUser(backendUser);
          setToken(newToken);
        } catch (err) {
          console.error("Auto-login failed:", err);
          await signOut(auth);
        }
      }

      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const login = ({ firebaseUser, backendUser, token }) => {
    setFirebaseUser(firebaseUser);
    setBackendUser(backendUser);
    setToken(token);
  };

  const logout = async () => {
    await signOut(auth);
    setFirebaseUser(null);
    setBackendUser(null);
    setToken(null);
  };

  return (
    <AuthContext.Provider
      value={{
        firebaseUser,
        backendUser,
        token,
        login,
        logout,
        isAuthenticated: !!backendUser,
        loading,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}