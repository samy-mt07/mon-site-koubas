// import { useContext, useState } from "react";
// import { useNavigate, Link } from "react-router-dom";
// import { AuthContext } from "../context/AuthContext";

// function LoginPage() {
//   const auth = useContext(AuthContext);
//   const navigate = useNavigate();

//   const [email, setEmail] = useState("");
//   const [password, setPassword] = useState("");
//   const [error, setError] = useState("");

//   async function handleSubmit(event) {
//     event.preventDefault();
//     setError("");

//     try {
//       await auth.login(email, password);
//       navigate("/");
//     } catch (err) {
//       setError(err.message);
//     }
//   }

//   return (
//     <div>
//       <h1>Login</h1>

//       {error && <p>{error}</p>}

//       <form onSubmit={handleSubmit}>
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

//         <button type="submit">Login</button>
//       </form>

//       {/* 🔥 AJOUT — bouton inscrire */}
//       <p>
//         Pas encore de compte ?{" "}
//         <Link to="/register">
//           <button type="button">Inscris-toi</button>
//         </Link>
//       </p>
//     </div>
//   );
// }

// export default LoginPage;

import { useContext, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";

// Bootstrap
import { Form, Button, Col, Row, Card, Alert } from "react-bootstrap";

function LoginPage() {
  const auth = useContext(AuthContext);
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");

    try {
      await auth.login(email, password);
      navigate("/");
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <Card className="p-4 mx-auto" style={{ maxWidth: "480px" }}>
      <h1 className="text-center mb-4">Login</h1>

      {error && <Alert variant="danger">{error}</Alert>}

      <Form onSubmit={handleSubmit}>
        {/* EMAIL */}
        <Form.Group className="mb-3">
          <Form.Label>Email</Form.Label>
          <Form.Control
            type="email"
            placeholder="Entrer votre email..."
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </Form.Group>

        {/* PASSWORD */}
        <Form.Group className="mb-3">
          <Form.Label>Mot de passe</Form.Label>
          <Form.Control
            type="password"
            placeholder="Entrer votre mot de passe..."
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </Form.Group>

        {/* BUTTON LOGIN */}
        <Button type="submit" variant="primary" className="w-100 mb-3">
          Login
        </Button>
      </Form>

      {/* REGISTER SECTION */}
      <p className="text-center mt-3">
        Pas encore de compte ?{" "}
        <Link to="/register">
          <Button variant="secondary" size="sm">
            Inscris-toi
          </Button>
        </Link>
      </p>
    </Card>
  );
}

export default LoginPage;
