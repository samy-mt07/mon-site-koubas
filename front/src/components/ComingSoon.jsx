import React from "react";
import Seo from "./Seo";
import "./ComingSoon.css";

function ComingSoon({ section, path }) {
  return (
    <div className="comingSoonPage">
      <Seo title={section} noindex path={path} />
      <div className="comingSoonCard">
        <h1>{section}</h1>
        <p>Cette section arrive bientôt — reviens nous voir sous peu!</p>
      </div>
    </div>
  );
}

export default ComingSoon;
