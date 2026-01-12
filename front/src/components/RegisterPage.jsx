// import { useContext, useState } from "react";
// import { useNavigate, Link } from "react-router-dom";
// import { AuthContext } from "../context/AuthContext";

// function RegisterPage() {
//   const auth = useContext(AuthContext);
//   const navigate = useNavigate();

//   const [fullName, setFullName] = useState("");
//   const [email, setEmail] = useState("");
//   const [password, setPassword] = useState("");
//   const [error, setError] = useState("");

//   async function handleSubmit(event) {
//     event.preventDefault();
//     setError("");

//     try {
//       // 🔥 Auto-login se fait dans auth.register
//       await auth.register(fullName, email, password);

//       // Ici, l'utilisateur a déjà un token + user en mémoire
//       // S'il venait du panier, il pourra payer direct
//       navigate("/checkout");
//     } catch (err) {
//       setError(err.message);
//     }
//   }

//   return (
//     <div>
//       <h1>Register</h1>

//       {error && <p>{error}</p>}

//       <form onSubmit={handleSubmit}>
//         <div>
//           <label>
//             Full name
//             <input
//               type="text"
//               value={fullName}
//               onChange={(e) => setFullName(e.target.value)}
//             />
//           </label>
//         </div>

//         <div>
//           <label>
//             Email
//             <input
//               type="email"
//               value={email}
//               onChange={(e) => setEmail(e.target.value)}
//             />
//           </label>
//         </div>

//         <div>
//           <label>
//             Password
//             <input
//               type="password"
//               value={password}
//               onChange={(e) => setPassword(e.target.value)}
//             />
//           </label>
//         </div>

//         <button type="submit">Créer le compte</button>
//       </form>

//       <p>
//         J’ai déjà un compte{" "}
//         <Link to="/login">
//           <button type="button">Me connecter</button>
//         </Link>
//       </p>
//     </div>
//   );
// }

import { useContext, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";

// ❗ Assure-toi d'avoir : import "bootstrap/dist/css/bootstrap.min.css"; dans main.jsx
import { Form, Button, Card } from "react-bootstrap";

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
      // Auto-login dans auth.register
      await auth.register(fullName, email, password);
      navigate("/checkout");
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <div className="d-flex justify-content-center mt-5">
      <Card style={{ maxWidth: "480px", width: "100%" }} className="p-4">
        <h1 className="text-center mb-4">Register</h1>

        {error && <p className="text-danger mb-3">{error}</p>}

        <Form onSubmit={handleSubmit}>
          {/* FULL NAME */}
          <Form.Group controlId="formFullName" className="mb-3">
            <Form.Label>Full name</Form.Label>
            <Form.Control
              type="text"
              placeholder="Entrez votre nom complet"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              required
            />
          </Form.Group>

          {/* EMAIL */}
          <Form.Group controlId="formEmail" className="mb-3">
            <Form.Label>Email</Form.Label>
            <Form.Control
              type="email"
              placeholder="Entrez votre email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </Form.Group>

          {/* PASSWORD */}
          <Form.Group controlId="formPassword" className="mb-3">
            <Form.Label>Password</Form.Label>
            <Form.Control
              type="password"
              placeholder="Entrez votre mot de passe"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </Form.Group>

          <Button variant="primary" type="submit" className="w-100">
            Créer le compte
          </Button>
        </Form>

        <p className="text-center mt-3 mb-0">
          J’ai déjà un compte{" "}
          <Link to="/login">
            <Button type="button" variant="link" className="p-0 align-baseline">
              Me connecter
            </Button>
          </Link>
        </p>
      </Card>
    </div>
  );
}

export default RegisterPage;
