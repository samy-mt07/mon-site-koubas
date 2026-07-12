import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "./components/layout/Navbar";
import AuthCard from "./components/AuthCard";
import "./App.css";

function App() {
  const navigate = useNavigate();
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [user, setUser] = useState(null);
  const [welcome, setWelcome] = useState("");

  const handleLogin = (userObj) => {
    setIsLoggedIn(true);
    setUser(userObj || null);
    setIsAuthOpen(false);
    const name = userObj?.full_name || userObj?.name || userObj?.email || "";
    setWelcome(`Bienvenue ${name}`);
    window.scrollTo({ top: 0, behavior: "smooth" });
    setTimeout(() => setWelcome(""), 2000);
  };

  const handleLogout = () => {
    setIsLoggedIn(false);
    setUser(null);
  };

  return (
    <div className="page-shell">
      <Navbar
        isLoggedIn={isLoggedIn}
        onUserClick={() => setIsAuthOpen(true)}
        onLogout={handleLogout}
      />
      <main className="homepage">
        <div className="homepageContent">
          <h1>KOUBA SCENTS</h1>
          <p>
            Sublimez votre intérieur avec l'art du parfum. Découvrez nos
            diffuseurs d'exception.
          </p>
          <button className="heroButton" type="button" onClick={() => navigate("/products")}>
            DÉCOUVRIR NOS COLLECTIONS
          </button>
        </div>
      </main>
      {isAuthOpen && <AuthCard onClose={() => setIsAuthOpen(false)} onLogin={handleLogin} />}
      {welcome && <div className="welcomeToast">{welcome}</div>}
    </div>
  );
}

export default App;
