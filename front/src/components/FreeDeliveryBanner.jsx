import React, { useEffect, useState } from "react";
import "./FreeDeliveryBanner.css";

function FreeDeliveryBanner() {
  const [freeDelivery, setFreeDelivery] = useState(false);

  useEffect(() => {
    let isMounted = true;

    fetch("/api/settings")
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (isMounted && data) {
          setFreeDelivery(Boolean(data.freeDelivery));
        }
      })
      .catch(() => {});

    return () => {
      isMounted = false;
    };
  }, []);

  if (!freeDelivery) return null;

  return <div className="freeDeliveryBanner">🚚 Livraison gratuite sur cette commande !</div>;
}

export default FreeDeliveryBanner;
