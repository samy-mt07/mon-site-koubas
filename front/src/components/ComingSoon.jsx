import React from "react";
import "./ComingSoon.css";

function ComingSoon({ section }) {
  return (
    <div className="comingSoonPage">
      <div className="comingSoonCard">
        <h1>{section}</h1>
        <p>Cette section arrive bientôt — reviens nous voir sous peu!</p>
      </div>
    </div>
  );
}

export default ComingSoon;
