import { createContext, useContext, useState, useEffect } from "react";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { auth } from "../firebase";
import { apiRequest } from "../services/api";
import { ensurePushRegistration, unregisterStoredPushToken } from "../services/pushMessaging";

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [firebaseUser, setFirebaseUser] = useState(null);
  const [backendUser, setBackendUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);

  // Auto-login on refresh
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        try {
          const newToken = await user.getIdToken();

          const nextBackendUser = await apiRequest("/auth/me", {
            headers: {
              Authorization: `Bearer ${newToken}`,
            },
          });

          setFirebaseUser(user);
          setBackendUser(nextBackendUser);
          setToken(newToken);

          ensurePushRegistration(newToken).catch((err) => {
            console.warn("Push registration failed:", err?.message || err);
          });
        } catch (err) {
          console.error("Auto-login failed:", err);
          await signOut(auth);
        }
      } else {
        setFirebaseUser(null);
        setBackendUser(null);
        setToken(null);
      }

      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const login = ({ firebaseUser: nextFirebaseUser, backendUser: nextBackendUser, token: nextToken }) => {
    setFirebaseUser(nextFirebaseUser);
    setBackendUser(nextBackendUser);
    setToken(nextToken);

    ensurePushRegistration(nextToken).catch((err) => {
      console.warn("Push registration failed:", err?.message || err);
    });
  };

  const logout = async () => {
    const currentToken = token;

    if (currentToken) {
      await unregisterStoredPushToken(currentToken);
    }

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
