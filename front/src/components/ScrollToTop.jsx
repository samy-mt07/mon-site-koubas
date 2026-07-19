import { useEffect } from "react";
import { useLocation } from "react-router-dom";

// Certaines navigations (ex: Navbar "Ma Collection" vers "/") passent un
// location.state.scrollTo pour cibler une ancre précise sur la page ; dans
// ce cas on laisse la page elle-même gérer le scroll et on ne remonte pas
// en haut par-dessus.
function ScrollToTop() {
  const location = useLocation();
  const { pathname, state } = location;

  useEffect(() => {
    if (state?.scrollTo) return;
    window.scrollTo({ top: 0, left: 0, behavior: "instant" });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname]);

  return null;
}

export default ScrollToTop;
