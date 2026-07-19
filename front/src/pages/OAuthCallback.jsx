import React, { useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import "./ResultPage.css";

function OAuthCallback() {
  const { login } = useAuth();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const token = searchParams.get("token");
  const rawUser = searchParams.get("user");
  const missingParams = !token || !rawUser;

  useEffect(() => {
    if (missingParams) return;

    try {
      const user = JSON.parse(rawUser);
      login(user, token);
      navigate("/", { replace: true });
    } catch {
      navigate("/?googleAuthError=1", { replace: true });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="resultPage">
      <div className="resultCard">
        <h1>{missingParams ? "Connexion échouée" : "Connexion en cours..."}</h1>
        {missingParams && <p>Connexion Google incomplète, réessaie.</p>}
      </div>
    </div>
  );
}

export default OAuthCallback;
