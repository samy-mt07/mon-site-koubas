import React, { useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import CollectionSection from "../components/CollectionSection";
import "../App.css";

function Home() {
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (location.state?.scrollTo === "collection") {
      const el = document.getElementById("collection");
      el?.scrollIntoView({ behavior: "smooth" });
      navigate(location.pathname, { replace: true, state: {} });
    }
  }, [location, navigate]);

  return (
    <>
      <section className="homepage">
        <div className="homepageContent">
          <h1>KOUBA SCENTS</h1>
          <p>
            Sublimez votre intérieur avec l'art du parfum. Découvrez nos
            diffuseurs d'exception.
          </p>
          <button
            className="heroButton"
            type="button"
            onClick={() => document.getElementById("collection")?.scrollIntoView({ behavior: "smooth" })}
          >
            DÉCOUVRIR NOS COLLECTIONS
          </button>
        </div>
      </section>
      <CollectionSection />
    </>
  );
}

export default Home;
