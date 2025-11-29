import { useContext } from "react";
import { Link } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";
import { CartContext } from "../context/CartContext";

function Navbar() {
  const auth = useContext(AuthContext);
  const cart = useContext(CartContext);

  // Si cart est null (par ex. si pas encore dans le provider),
  // on évite l'erreur et on met 0.
  const totalItems =
    cart && typeof cart.getTotalQuantity === "function"
      ? cart.getTotalQuantity()
      : 0;

  function handleLogout() {
    if (auth && typeof auth.logout === "function") {
      auth.logout();
    }
  }

  return (
    <nav>
      <Link to="/">Home</Link>
      {" | "}
      <Link to="/cart">Cart ({totalItems})</Link>
      {" | "}
      {auth && auth.user ? (
        <span>
          Hello {auth.user.full_name}{" "}
          <button type="button" onClick={handleLogout}>
            Logout
          </button>
        </span>
      ) : (
        <span>
          <Link to="/login">Login</Link>
          {" | "}
          <Link to="/register">Register</Link>
        </span>
      )}
    </nav>
  );
}

export default Navbar;
