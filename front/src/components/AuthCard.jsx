import React, { useState } from "react";
import RegisterCard from "./RegisterCard";
import VerifyCodeCard from "./VerifyCodeCard";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";
import "./AuthCard.css";

function AuthCard({ onClose, onAuthenticated, forceVerify = false }) {
  const { login, logout, user } = useAuth();
  const { showToast } = useToast();
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
    if (nextUser?.full_name) {
      showToast(`Bienvenue, ${nextUser.full_name.split(" ")[0]} !`);
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
              if (nextUser?.full_name) {
                showToast(`Bienvenue, ${nextUser.full_name.split(" ")[0]} !`);
              }
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
                  <svg className="authGoogleIcon" viewBox="0 0 48 48" width="18" height="18" aria-hidden="true">
                    <path fill="#FFC107" d="M43.611 20.083H42V20H24v8h11.303c-1.649 4.657-6.08 8-11.303 8-6.627 0-12-5.373-12-12s5.373-12 12-12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4 12.955 4 4 12.955 4 24s8.955 20 20 20 20-8.955 20-20c0-1.341-.138-2.65-.389-3.917z"/>
                    <path fill="#FF3D00" d="M6.306 14.691l6.571 4.819C14.655 15.108 18.961 12 24 12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4 16.318 4 9.656 8.337 6.306 14.691z"/>
                    <path fill="#4CAF50" d="M24 44c5.166 0 9.86-1.977 13.409-5.192l-6.19-5.238A11.91 11.91 0 0 1 24 36c-5.202 0-9.619-3.317-11.283-7.946l-6.522 5.025C9.505 39.556 16.227 44 24 44z"/>
                    <path fill="#1976D2" d="M43.611 20.083H42V20H24v8h11.303a12.04 12.04 0 0 1-4.087 5.571l.003-.002 6.19 5.238C36.971 39.205 44 34 44 24c0-1.341-.138-2.65-.389-3.917z"/>
                  </svg>
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
