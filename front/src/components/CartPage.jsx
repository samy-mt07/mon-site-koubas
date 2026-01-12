import { useContext } from "react";
import { useNavigate } from "react-router-dom";
import { CartContext } from "../context/CartContext";
import { AuthContext } from "../context/AuthContext";

function CartPage() {
  const cart = useContext(CartContext);
  const auth = useContext(AuthContext);
  const navigate = useNavigate();

  const items = cart.items;
  const totalPrice = cart.getTotalPrice();

  if (items.length === 0) {
    return (
      <div className="cart-empty">
        <h2>Your cart is empty.</h2>
      </div>
    );
  }

  function handlePay() {
    // Si pas connecté → va à /register
    if (!auth || !auth.user) {
      navigate("/register");
      return;
    }

    // Si connecté → va à /checkout
    navigate("/checkout");
  }

  return (
    <div className="cart-page container">
      <h2>Panier</h2>

      <div className="cart-items product-list">
        {items.map((item) => {
          const subtotal = item.price * item.quantity;

          function handleRemove() {
            cart.removeFromCart(item.id);
          }

          function handleIncrease() {
            cart.increaseQuantity(item.id);
          }

          function handleDecrease() {
            cart.decreaseQuantity(item.id);
          }

          return (
            <div key={item.id} className="card">
              <h3 className="mb-2">{item.name}</h3>

              <p>Unit price: {item.price.toFixed(2)} $</p>

              <div className="cart-qty-group">
                <button
                  type="button"
                  className="btn-cart-qty"
                  onClick={handleDecrease}
                >
                  -
                </button>
                <span className="cart-qty-value">{item.quantity}</span>
                <button
                  type="button"
                  className="btn-cart-qty"
                  onClick={handleIncrease}
                >
                  +
                </button>
              </div>

              <p className="mt-2">Subtotal: {subtotal.toFixed(2)} $</p>

              <button
                type="button"
                className="btn-cart-remove"
                onClick={handleRemove}
              >
                Remove
              </button>
            </div>
          );
        })}
      </div>

      <div className="cart-summary text-center mt-4">
        <h2>Total: {totalPrice.toFixed(2)} $</h2>
        <button type="button" className="btn-cart-commande" onClick={handlePay}>
          Commander
        </button>
      </div>
    </div>
  );
}

export default CartPage;
