import { createContext, useState, useEffect } from "react";

export const AuthContext = createContext(null);

export function AuthProvider(props) {
  const [user, setUser] = useState(null); // { id, full_name, email }
  const [token, setToken] = useState(null);

  useEffect(function () {
    const savedToken = localStorage.getItem("token");
    const savedUser = localStorage.getItem("user");

    if (savedToken && savedUser) {
      setToken(savedToken);
      setUser(JSON.parse(savedUser));
    }
  }, []);

  function saveAuth(newUser, newToken) {
    setUser(newUser);
    setToken(newToken);
    localStorage.setItem("token", newToken);
    localStorage.setItem("user", JSON.stringify(newUser));
  }

  function clearAuth() {
    setUser(null);
    setToken(null);
    localStorage.removeItem("token");
    localStorage.removeItem("user");
  }

  async function login(email, password) {
    const response = await fetch("http://localhost:4000/api/auth/login", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ email: email, password: password }),
    });

    const data = await response.json();

    if (!response.ok) {
      const message = data && data.message ? data.message : "Login failed";
      throw new Error(message);
    }

    saveAuth(data.user, data.token);
  }

  async function register(full_name, email, password) {
    const response = await fetch("http://localhost:4000/api/auth/register", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        full_name: full_name,
        email: email,
        password: password,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      const message = data && data.message ? data.message : "Register failed";
      throw new Error(message);
    }

    // 🔥 Ici on AUTO-LOGIN après inscription
    if (data.user && data.token) {
      saveAuth(data.user, data.token);
    }

    // On renvoie les infos au composant si besoin
    return data;
  }

  const value = {
    user,
    token,
    login,
    register,
    logout: clearAuth,
  };

  return (
    <AuthContext.Provider value={value}>{props.children}</AuthContext.Provider>
  );
}
