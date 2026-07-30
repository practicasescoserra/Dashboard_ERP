import { createContext, useState, useEffect, useContext, useRef } from "react";
import { apiRequest, ApiError } from "../api/client";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [accessToken, setAccessToken] = useState(null);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const hasTriedRestore = useRef(false);

  useEffect(() => {
    if (hasTriedRestore.current) return;
    hasTriedRestore.current = true

    async function tryRestoreSession() {
      try {
        const data = await apiRequest('/auth/refresh', { method: 'POST' });
        setAccessToken(data.access_token);
        const me = await apiRequest('/users/me', {
          headers: { Authorization: `Bearer ${data.access_token}` },
        });
        setUser(me);
      } catch {
        setAccessToken(null);
        setUser(null);
      } finally {
        setLoading(false);
      }
    }
    tryRestoreSession();
  }, []);

  async function login(identifier, password) {
    const data = await apiRequest('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ identifier, password }),
    })
    setAccessToken(data.access_token)
    const me = await apiRequest('/users/me', {
      headers: { Authorization: `Bearer ${data.access_token}` },
    })
    setUser(me)
  }

  async function logout() {
    await apiRequest('/auth/logout', { method: 'POST' });
    setAccessToken(null);
    setUser(null);
  }

  async function authRequest(path, options = {}) {
    try {
      return await apiRequest(path, {
        ...options,
        headers: {
          Authorization: `Bearer ${accessToken}`,
          ...options.headers,
        },
      })
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) {
        try {
          const refreshed = await apiRequest('/auth/refresh', { method: 'POST' })
          setAccessToken(refreshed.access_token)
          return await apiRequest(path, {
            ...options,
            headers: {
              Authorization: `Bearer ${refreshed.access_token}`,
              ...options.headers,
            },
          })
        } catch (refreshErr) {
          setAccessToken(null)
          setUser(null)
          throw refreshErr
        }
      }
      throw err
    }
  }

  async function authDownload(path) {
  const BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:8000";

  async function attempt(token) {
    const response = await fetch(`${BASE_URL}${path}`, {
      credentials: "include",
      headers: { Authorization: `Bearer ${token}` },
    });
    return response;
  }

  let response = await attempt(accessToken);

  if (response.status === 401) {
    const refreshed = await apiRequest("/auth/refresh", { method: "POST" });
    setAccessToken(refreshed.access_token);
    response = await attempt(refreshed.access_token);
  }

  if (!response.ok) {
    throw new Error("No se pudo generar el archivo");
  }

  const blob = await response.blob();
  const disposition = response.headers.get("Content-Disposition") || "";
  const match = disposition.match(/filename=(.+)/);
  const filename = match ? match[1] : "reporte";

  const url = window.URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.URL.revokeObjectURL(url);
}

  const value = { accessToken, user, login, logout, loading, authRequest, authDownload };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}