import React, { useState } from "react";
import { useAuth } from "../context/AuthContext";

function RegisterCard({ onAuthenticated }) {
  const { login } = useAuth();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");
    setSuccess("");

    if (!name || !email || !password || !confirmPassword) {
      setError("Merci de remplir tous les champs.");
      return;
    }

    if (password !== confirmPassword) {
      setError("Les mots de passe doivent correspondre.");
      return;
    }

    setLoading(true);

    try {
      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          full_name: name,
          email,
          password,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Erreur lors de l'inscription.");
      }

      setSuccess("Inscription réussie !");
      setName("");
      setEmail("");
      setPassword("");
      setConfirmPassword("");
      // email_verified est toujours false ici (nouveau compte) — AuthCard
      // bascule sur l'écran de code via handleAuthResult/onAuthenticated.
      login(data.user || null, data.token || null);
      onAuthenticated?.(data.user || null);
    } catch (err) {
      setError(err.message || "Erreur réseau.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="registerWrapper">
      <h2>Créer un compte</h2>
      <p className="authSubtitle">
        Rejoignez Aura Scents pour profiter de votre espace personnel.
      </p>
      <form className="authForm" onSubmit={handleSubmit}>
        <label htmlFor="register-name">Nom</label>
        <input
          id="register-name"
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Votre nom"
          className="authInput"
        />

        <label htmlFor="register-email">Email</label>
        <input
          id="register-email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="votre@email.com"
          className="authInput"
        />

        <label htmlFor="register-password">Mot de passe</label>
        <div className="passwordField">
          <input
            id="register-password"
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

        <label htmlFor="register-confirm-password">Confirmer le mot de passe</label>
        <div className="passwordField">
          <input
            id="register-confirm-password"
            type={showConfirmPassword ? "text" : "password"}
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            placeholder="••••••••"
            className="authInput"
          />
          <button
            type="button"
            className="passwordToggle"
            onClick={() => setShowConfirmPassword((value) => !value)}
            aria-label={showConfirmPassword ? "Masquer le mot de passe" : "Afficher le mot de passe"}
          >
            {showConfirmPassword ? "🙈" : "👁️"}
          </button>
        </div>

        {error && <div className="authMessage authError">{error}</div>}
        {success && <div className="authMessage authSuccess">{success}</div>}

        <button type="submit" className="authSubmitButton" disabled={loading}>
          {loading ? "Patientez..." : "CRÉER UN COMPTE"}
        </button>
      </form>
    </div>
  );
}

export default RegisterCard;
