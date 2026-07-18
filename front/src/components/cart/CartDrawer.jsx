import React from "react";
import { useNavigate } from "react-router-dom";
import { X } from "lucide-react";
import { useCart } from "../../context/CartContext";
import { resolveImageUrl, formatPrice } from "../../context/ProductsContext";
import styles from "./CartDrawer.module.css";

function CartDrawer() {
  const { items, isDrawerOpen, closeDrawer, totalCents } = useCart();
  const navigate = useNavigate();

  if (!isDrawerOpen) return null;

  return (
    <div className={styles.overlay} onClick={closeDrawer}>
      <aside className={styles.drawer} onClick={(event) => event.stopPropagation()}>
        <div className={styles.header}>
          <h2>Mon panier</h2>
          <button type="button" className={styles.closeButton} onClick={closeDrawer} aria-label="Fermer">
            <X size={20} />
          </button>
        </div>

        {items.length === 0 ? (
          <p className={styles.empty}>Votre panier est vide pour le moment.</p>
        ) : (
          <>
            <ul className={styles.list}>
              {items.map((item) => (
                <li key={item.id} className={styles.item}>
                  <div className={styles.itemImageWrapper}>
                    {item.image_url ? (
                      <img src={resolveImageUrl(item.image_url)} alt={item.name} className={styles.itemImage} />
                    ) : (
                      <div className={styles.itemPlaceholder} />
                    )}
                  </div>
                  <div className={styles.itemInfo}>
                    <span className={styles.itemName}>{item.name}</span>
                    <span className={styles.itemMeta}>
                      Qté {item.quantity} · {formatPrice(item.price_cents * item.quantity)}
                    </span>
                  </div>
                </li>
              ))}
            </ul>

            <div className={styles.footer}>
              <div className={styles.total}>
                <span>Total</span>
                <span>{formatPrice(totalCents)}</span>
              </div>
              <button
                type="button"
                className={styles.viewCartButton}
                onClick={() => {
                  closeDrawer();
                  navigate("/panier");
                }}
              >
                VOIR LE PANIER COMPLET
              </button>
            </div>
          </>
        )}
      </aside>
    </div>
  );
}

export default CartDrawer;
