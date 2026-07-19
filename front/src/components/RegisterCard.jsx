// import React, { useState } from "react";
// import { useAuth } from "../context/AuthContext";

// function RegisterCard({ onAuthenticated }) {
//   const { login } = useAuth();
//   const [name, setName] = useState("");
//   const [email, setEmail] = useState("");
//   const [password, setPassword] = useState("");
//   const [confirmPassword, setConfirmPassword] = useState("");
//   const [showPassword, setShowPassword] = useState(false);
//   const [showConfirmPassword, setShowConfirmPassword] = useState(false);
//   const [error, setError] = useState("");
//   const [success, setSuccess] = useState("");
//   const [loading, setLoading] = useState(false);

//   const handleSubmit = async (event) => {
//     event.preventDefault();
//     setError("");
//     setSuccess("");

//     if (!name || !email || !password || !confirmPassword) {
//       setError("Merci de remplir tous les champs.");
//       return;
//     }

//     if (password !== confirmPassword) {
//       setError("Les mots de passe doivent correspondre.");
//       return;
//     }

//     setLoading(true);

//     try {
//       const response = await fetch("/api/auth/register", {
//         method: "POST",
//         headers: {
//           "Content-Type": "application/json",
//         },
//         body: JSON.stringify({
//           full_name: name,
//           email,
//           password,
//         }),
//       });

//       const data = await response.json();

//       if (!response.ok) {
//         throw new Error(data.error || "Erreur lors de l'inscription.");
//       }

//       setSuccess("Inscription réussie !");
//       setName("");
//       setEmail("");
//       setPassword("");
//       setConfirmPassword("");
//       // email_verified est toujours false ici (nouveau compte) — AuthCard
//       // bascule sur l'écran de code via handleAuthResult/onAuthenticated.
//       login(data.user || null, data.token || null);
//       onAuthenticated?.(data.user || null);
//     } catch (err) {
//       setError(err.message || "Erreur réseau.");
//     } finally {
//       setLoading(false);
//     }
//   };

//   return (
//     <div className="registerWrapper">
//       <h2>Créer un compte</h2>
//       <p className="authSubtitle">
//         Rejoignez Aura Scents pour profiter de votre espace personnel.
//       </p>
//       <form className="authForm" onSubmit={handleSubmit}>
//         <label htmlFor="register-name">Nom</label>
//         <input
//           id="register-name"
//           type="text"
//           value={name}
//           onChange={(e) => setName(e.target.value)}
//           placeholder="Votre nom"
//           className="authInput"
//         />

//         <label htmlFor="register-email">Email</label>
//         <input
//           id="register-email"
//           type="email"
//           value={email}
//           onChange={(e) => setEmail(e.target.value)}
//           placeholder="votre@email.com"
//           className="authInput"
//         />

//         <label htmlFor="register-password">Mot de passe</label>
//         <div className="passwordField">
//           <input
//             id="register-password"
//             type={showPassword ? "text" : "password"}
//             value={password}
//             onChange={(e) => setPassword(e.target.value)}
//             placeholder="••••••••"
//             className="authInput"
//           />
//           <button
//             type="button"
//             className="passwordToggle"
//             onClick={() => setShowPassword((value) => !value)}
//             aria-label={showPassword ? "Masquer le mot de passe" : "Afficher le mot de passe"}
//           >
//             {showPassword ? "🙈" : "👁️"}
//           </button>
//         </div>

//         <label htmlFor="register-confirm-password">Confirmer le mot de passe</label>
//         <div className="passwordField">
//           <input
//             id="register-confirm-password"
//             type={showConfirmPassword ? "text" : "password"}
//             value={confirmPassword}
//             onChange={(e) => setConfirmPassword(e.target.value)}
//             placeholder="••••••••"
//             className="authInput"
//           />
//           <button
//             type="button"
//             className="passwordToggle"
//             onClick={() => setShowConfirmPassword((value) => !value)}
//             aria-label={showConfirmPassword ? "Masquer le mot de passe" : "Afficher le mot de passe"}
//           >
//             {showConfirmPassword ? "🙈" : "👁️"}
//           </button>
//         </div>

//         {error && <div className="authMessage authError">{error}</div>}
//         {success && <div className="authMessage authSuccess">{success}</div>}

//         <button type="submit" className="authSubmitButton" disabled={loading}>
//           {loading ? "Patientez..." : "CRÉER UN COMPTE"}
//         </button>
//       </form>
//     </div>
//   );
// }

// export default RegisterCard;


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
  const [agreedToPolicy, setAgreedToPolicy] = useState(false);
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

    if (!agreedToPolicy) {
      setError("Vous devez accepter la politique de confidentialité pour créer un compte.");
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
      setAgreedToPolicy(false);
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

        <label className="authConsentLabel" htmlFor="register-consent">
          <input
            id="register-consent"
            type="checkbox"
            checked={agreedToPolicy}
            onChange={(e) => setAgreedToPolicy(e.target.checked)}
            className="authConsentCheckbox"
          />
          <span>
            J'accepte la{" "}
            <a
              href="/politique-confidentialite"
              target="_blank"
              rel="noopener noreferrer"
              className="authPolicyLink"
            >
              politique de confidentialité
            </a>{" "}
            d'Aura Scents.
          </span>
        </label>

        {error && <div className="authMessage authError">{error}</div>}
        {success && <div className="authMessage authSuccess">{success}</div>}

        <button
          type="submit"
          className="authSubmitButton"
          disabled={loading}
        >
          {loading ? "Patientez..." : "CRÉER UN COMPTE"}
        </button>

        <a
          href="/api/auth/google"
          className={`authGoogleButton${!agreedToPolicy ? " authGoogleButtonDisabled" : ""}`}
          aria-disabled={!agreedToPolicy}
          tabIndex={agreedToPolicy ? undefined : -1}
          onClick={(e) => {
            if (!agreedToPolicy) e.preventDefault();
          }}
        >
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
  );
}

export default RegisterCard;