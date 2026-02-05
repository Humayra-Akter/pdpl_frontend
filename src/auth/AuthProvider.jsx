import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { apiGet } from "../lib/api";
import { clearSession, getCachedUser, getToken, setSession } from "./authStore";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(getCachedUser());
  const [loading, setLoading] = useState(true);

  async function refresh() {
    const token = getToken();
    if (!token) {
      setUser(null);
      setLoading(false);
      return;
    }

    try {
      const data = await apiGet("/auth/me", token);
      setUser(data.user);
      // keep cache in sync
      setSession({ token, user: data.user });
    } catch {
      clearSession();
      setUser(null);
    } finally {
      setLoading(false);
    }
  }

  function logout() {
    clearSession();
    setUser(null);
    window.location.href = "/login";
  }

  useEffect(() => {
    refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const value = useMemo(
    () => ({ user, loading, refresh, logout }),
    [user, loading],
  );
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  return useContext(AuthContext);
}
