import {
  createContext,
  useContext,
  useEffect,
  useState,
} from "react";

import api from "../services/api";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    restoreSession();
  }, []);

  async function restoreSession() {
    const token = localStorage.getItem(
      "meditrack_access_token"
    );

    if (!token) {
      setLoading(false);
      return;
    }

    try {
      const response = await api.get("/auth/me");

      setUser(response.data.user);
    } catch (error) {
      localStorage.removeItem(
        "meditrack_access_token"
      );

      setUser(null);
    } finally {
      setLoading(false);
    }
  }

  async function login(
    email,
    password,
    selectedRole
  ) {
    const response = await api.post(
      "/auth/login",
      {
        email,
        password,
        selectedRole,
      }
    );

    const {
      token,
      user,
    } = response.data;

    localStorage.setItem(
      "meditrack_access_token",
      token
    );

    setUser(user);

    return response.data;
  }

  function logout() {
    localStorage.removeItem(
      "meditrack_access_token"
    );

    setUser(null);
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        login,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}