import { useContext, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";

function RegisterPage() {
  const auth = useContext(AuthContext);
  const navigate = useNavigate();

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");

    try {
      // 🔥 Auto-login se fait dans auth.register
      await auth.register(fullName, email, password);

      // Ici, l'utilisateur a déjà un token + user en mémoire
      // S'il venait du panier, il pourra payer direct
      navigate("/checkout");
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <div>
      <h1>Register</h1>

      {error && <p>{error}</p>}

      <form onSubmit={handleSubmit}>
        <div>
          <label>
            Full name
            <input
              type="text"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
            />
          </label>
        </div>

        <div>
          <label>
            Email
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </label>
        </div>

        <div>
          <label>
            Password
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </label>
        </div>

        <button type="submit">Créer le compte</button>
      </form>

      <p>
        J’ai déjà un compte{" "}
        <Link to="/login">
          <button type="button">Me connecter</button>
        </Link>
      </p>
    </div>
  );
}

export default RegisterPage;
