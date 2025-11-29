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
    return <p>Your cart is empty.</p>;
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
    <div>
      <h1>Cart</h1>

      {items.map(function (item) {
        function handleRemove() {
          cart.removeFromCart(item.id);
        }

        function handleIncrease() {
          cart.increaseQuantity(item.id);
        }

        function handleDecrease() {
          cart.decreaseQuantity(item.id);
        }

        const subtotal = item.price * item.quantity;

        return (
          <div key={item.id}>
            <p>{item.name}</p>

            <p>Unit price: {item.price.toFixed(2)}</p>

            <div>
              <button type="button" onClick={handleDecrease}>
                -
              </button>
              <span> {item.quantity} </span>
              <button type="button" onClick={handleIncrease}>
                +
              </button>
            </div>

            <p>Subtotal: {subtotal.toFixed(2)}</p>

            <button type="button" onClick={handleRemove}>
              Remove
            </button>

            <hr />
          </div>
        );
      })}

      <h2>Total: {totalPrice.toFixed(2)}</h2>

      {/* 🔥 ancien bouton Clear cart remplacé par Payer */}
      <button type="button" onClick={handlePay}>
        Commander
      </button>
    </div>
  );
}

export default CartPage;
