import React, { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";

const RESEND_COOLDOWN_SECONDS = 60;

function VerifyCodeCard({ email, onVerified, onLogout }) {
  const { login } = useAuth();
  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  const [info, setInfo] = useState("");
  const [loading, setLoading] = useState(false);
  const [cooldown, setCooldown] = useState(0);

  useEffect(() => {
    if (cooldown <= 0) return;
    const timer = setInterval(() => {
      setCooldown((value) => (value > 0 ? value - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, [cooldown]);

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");
    setInfo("");

    if (!code || code.length !== 6) {
      setError("Entre le code à 6 chiffres reçu par email.");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/auth/verify-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, code }),
      });
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Erreur lors de la vérification.");
      }

      login(data.user || null, data.token || null);
      onVerified?.(data.user || null);
    } catch (err) {
      setError(err.message || "Erreur réseau.");
    } finally {
      setLoading(false);
    }
  }

  async function handleResend() {
    setError("");
    setInfo("");
    setLoading(true);
    try {
      const res = await fetch("/api/auth/resend-code", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();

      if (!res.ok) {
        if (res.status === 429 && data.retryAfterMs) {
          setCooldown(Math.ceil(data.retryAfterMs / 1000));
        }
        throw new Error(data.error || "Erreur lors du renvoi du code.");
      }

      setInfo("Nouveau code envoyé.");
      setCooldown(RESEND_COOLDOWN_SECONDS);
    } catch (err) {
      setError(err.message || "Erreur réseau.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="authPanel authPanelLeft" style={{ width: "100%" }}>
      <h2>Vérifie ton email</h2>
      <p className="authSubtitle">
        On a envoyé un code à 6 chiffres à <strong>{email}</strong>. Entre-le
        ci-dessous pour continuer.
      </p>
      <form className="authForm" onSubmit={handleSubmit}>
        <label htmlFor="verify-code">Code de vérification</label>
        <input
          id="verify-code"
          type="text"
          inputMode="numeric"
          maxLength={6}
          value={code}
          onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
          placeholder="123456"
          className="authInput"
          style={{ letterSpacing: "0.5rem", textAlign: "center", fontSize: "1.3rem" }}
        />

        {error && <div className="authMessage authError">{error}</div>}
        {info && <div className="authMessage authSuccess">{info}</div>}

        <button type="submit" className="authSubmitButton" disabled={loading}>
          {loading ? "Patientez..." : "VÉRIFIER"}
        </button>

        <button
          type="button"
          className="authSubmitButton"
          style={{ background: "transparent", border: "1px solid #e3d1b5" }}
          onClick={handleResend}
          disabled={loading || cooldown > 0}
        >
          {cooldown > 0 ? `Renvoyer le code (${cooldown}s)` : "Renvoyer le code"}
        </button>

        {onLogout && (
          <button
            type="button"
            className="authSubmitButton"
            style={{ background: "transparent", boxShadow: "none", color: "#5c4f3b" }}
            onClick={onLogout}
          >
            Se déconnecter
          </button>
        )}
      </form>
    </div>
  );
}

export default VerifyCodeCard;
