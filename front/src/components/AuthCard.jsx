import React, { useState } from "react";
import RegisterCard from "./RegisterCard";
import "./AuthCard.css";

function AuthCard({ onClose, onLogin }) {
  const [activeTab, setActiveTab] = useState("login");
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleAuthSubmit = async (event) => {
    event.preventDefault();
    setError("");

    if (!email || !password) {
      setError("Veuillez renseigner l'email et le mot de passe.");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Erreur lors de la connexion.");
      }

      const user = data.user || null;
      if (typeof onLogin === "function") {
        onLogin(user);
      }
    } catch (err) {
      setError(err.message || "Erreur réseau.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="authOverlay">
      <div className="authCard">
        <button className="authCloseButton" type="button" onClick={onClose}>
          ×
        </button>

        <div className="authHeader">
          <button
            type="button"
            className={activeTab === "login" ? "authTab active" : "authTab"}
            onClick={() => setActiveTab("login")}
          >
            CONNEXION
          </button>
          <button
            type="button"
            className={activeTab === "register" ? "authTab active" : "authTab"}
            onClick={() => setActiveTab("register")}
          >
            CRÉER UN COMPTE
          </button>
        </div>

        <div className="authContent">
          <div className={`authSlider ${activeTab === "register" ? "slideRight" : ""}`}>
            <div className="authPanel authPanelLeft">
              <h2>Connexion</h2>
              <p className="authSubtitle">
                Connectez-vous pour poursuivre votre expérience Aura Scents.
              </p>
              <form className="authForm" onSubmit={handleAuthSubmit}>
                <label htmlFor="auth-email">Email</label>
                <input
                  id="auth-email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="votre@email.com"
                  className="authInput"
                />

                <label htmlFor="auth-password">Mot de passe</label>
                <div className="passwordField">
                  <input
                    id="auth-password"
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="authInput"
                  />
                  <button
                    type="button"
                    className="passwordToggle"
                    onClick={() => setShowPassword((value) => !value)}
                    aria-label={showPassword ? "Masquer le mot de passe" : "Afficher le mot de passe"}
                  >
                    {showPassword ? "🙈" : "👁️"}
                  </button>
                </div>

                {error && <div className="authMessage authError">{error}</div>}

                <button type="submit" className="authSubmitButton" disabled={loading}>
                  {loading ? "Patientez..." : "SE CONNECTER"}
                </button>
              </form>
            </div>

            <div className="authPanel authPanelRight">
              <RegisterCard />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default AuthCard;
