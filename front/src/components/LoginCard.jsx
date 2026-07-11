import React, { useState } from "react";
import styles from "./LoginCard.module.css";

function LoginCard({ onClose }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");

    if (!email || !password) {
      setError("Veuillez remplir tous les champs.");
      return;
    }

    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, password }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Erreur lors de la connexion.");
      }

      const data = await response.json();
      console.log("Login successful", data);
      onClose();
    } catch (err) {
      setError(err.message || "Erreur réseau.");
    }
  }

  return (
    <div className={styles.overlay} role="dialog" aria-modal="true">
      <div className={styles.card}>
        <button className={styles.closeButton} type="button" onClick={onClose}>
          ×
        </button>
        <div className={styles.content}>
          <h2>Connexion</h2>
          <p>Connectez-vous pour accéder à votre compte et suivre vos commandes.</p>
          <form className={styles.form} onSubmit={handleSubmit}>
            <label className={styles.label} htmlFor="login-email">
              Email
            </label>
            <input
              id="login-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className={styles.input}
              placeholder="votre@email.com"
            />

            <label className={styles.label} htmlFor="login-password">
              Mot de passe
            </label>
            <input
              id="login-password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className={styles.input}
              placeholder="••••••••"
            />

            {error && <div className={styles.error}>{error}</div>}

            <button type="submit" className={styles.submitButton}>
              Se connecter
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

export default LoginCard;
