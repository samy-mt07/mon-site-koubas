import { createContext, useState, useEffect } from "react";

export const CartContext = createContext(null);

export function CartProvider(props) {
  const [items, setItems] = useState([]); // { id, name, price, quantity }

  // Charger le panier depuis localStorage au démarrage
  useEffect(function () {
    const savedCart = localStorage.getItem("cart_items");
    if (savedCart) {
      try {
        const parsed = JSON.parse(savedCart);
        if (Array.isArray(parsed)) {
          setItems(parsed);
        }
      } catch (e) {
        console.error("Erreur parse cart", e);
      }
    }
  }, []);

  // Sauvegarder le panier à chaque changement
  useEffect(
    function () {
      localStorage.setItem("cart_items", JSON.stringify(items));
    },
    [items]
  );

  // Ajouter un produit (ou augmenter sa quantité)
  function addToCart(product) {
    setItems(function (prevItems) {
      const existing = prevItems.find(function (item) {
        return item.id === product.id;
      });

      const numericPrice = Number(product.price); // ici price = 24.99

      if (existing) {
        return prevItems.map(function (item) {
          if (item.id === product.id) {
            return {
              id: item.id,
              name: item.name,
              price: item.price, // déjà numeric
              quantity: item.quantity + 1,
            };
          }
          return item;
        });
      }

      const newItem = {
        id: product.id,
        name: product.name,
        price: numericPrice,
        quantity: 1,
      };

      return prevItems.concat(newItem);
    });
  }

  // Retirer totalement un produit du panier
  function removeFromCart(productId) {
    setItems(function (prevItems) {
      return prevItems.filter(function (item) {
        return item.id !== productId;
      });
    });
  }

  // Vider le panier
  function clearCart() {
    setItems([]);
  }

  // Augmenter la quantité d'un produit
  function increaseQuantity(productId) {
    setItems(function (prevItems) {
      return prevItems.map(function (item) {
        if (item.id === productId) {
          return {
            id: item.id,
            name: item.name,
            price: item.price,
            quantity: item.quantity + 1,
          };
        }
        return item;
      });
    });
  }

  // Diminuer la quantité (si 1 → supprime le produit)
  function decreaseQuantity(productId) {
    setItems(function (prevItems) {
      return prevItems
        .map(function (item) {
          if (item.id === productId) {
            return {
              id: item.id,
              name: item.name,
              price: item.price,
              quantity: item.quantity - 1,
            };
          }
          return item;
        })
        .filter(function (item) {
          return item.quantity > 0;
        });
    });
  }

  // Nombre total d'articles (pour la navbar)
  function getTotalQuantity() {
    return items.reduce(function (sum, item) {
      return sum + item.quantity;
    }, 0);
  }

  // Prix total
  function getTotalPrice() {
    return items.reduce(function (sum, item) {
      return sum + item.price * item.quantity;
    }, 0);
  }

  const value = {
    items,
    addToCart,
    removeFromCart,
    clearCart,
    increaseQuantity,
    decreaseQuantity,
    getTotalQuantity,
    getTotalPrice,
  };

  return (
    <CartContext.Provider value={value}>{props.children}</CartContext.Provider>
  );
}
