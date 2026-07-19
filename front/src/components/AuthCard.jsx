import React, { useState } from "react";
import RegisterCard from "./RegisterCard";
import VerifyCodeCard from "./VerifyCodeCard";
import { useAuth } from "../context/AuthContext";
import "./AuthCard.css";

function AuthCard({ onClose, onAuthenticated, forceVerify = false }) {
  const { login, logout, user } = useAuth();
  const [activeTab, setActiveTab] = useState("login");
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [verifyEmail, setVerifyEmail] = useState(forceVerify ? user?.email : null);

  // Un compte non vérifié ne doit pas pouvoir naviguer : si le login/register
  // renvoie email_verified=false, on bascule sur l'écran de code au lieu de
  // fermer la modale.
  function handleAuthResult(nextUser) {
    if (nextUser && nextUser.email_verified === false) {
      setVerifyEmail(nextUser.email);
      return;
    }
    onAuthenticated?.(nextUser);
  }

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

      login(data.user || null, data.token || null);
      handleAuthResult(data.user || null);
    } catch (err) {
      setError(err.message || "Erreur réseau.");
    } finally {
      setLoading(false);
    }
  };

  function handleClose() {
    if (verifyEmail && forceVerify) {
      // Compte connecté mais non vérifié : "fermer" = se déconnecter,
      // sinon l'utilisateur resterait coincé sans pouvoir naviguer.
      logout();
    }
    onClose?.();
  }

  if (verifyEmail) {
    return (
      <div className="authOverlay">
        <div className="authCard">
          <button className="authCloseButton" type="button" onClick={handleClose}>
            ×
          </button>
          <VerifyCodeCard
            email={verifyEmail}
            onVerified={(nextUser) => {
              setVerifyEmail(null);
              onAuthenticated?.(nextUser);
            }}
            onLogout={forceVerify ? logout : undefined}
          />
        </div>
      </div>
    );
  }

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

                <a href="/api/auth/google" className="authGoogleButton">
                  Continuer avec Google
                </a>
              </form>
            </div>

            <div className="authPanel authPanelRight">
              <RegisterCard onAuthenticated={handleAuthResult} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default AuthCard;
