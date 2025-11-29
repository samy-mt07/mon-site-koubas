function ProductCard(props) {
  const product = props.product;

  // Ton API renvoie price_cents (ex: 2499)
  const price =
    product.price_cents != null ? Number(product.price_cents) / 100 : 0;

  function handleClick() {
    if (props.onAddToCart) {
      // On passe un produit avec un champ `price` déjà en euros/dollars
      props.onAddToCart({
        ...product,
        price: price, // 24.99 par exemple
      });
    }
  }

  return (
    <div>
      <h3>{product.name}</h3>
      <img src={product.image_url} alt={product.name} width="200" />
      <p>Price: {price.toFixed(2)}</p>
      <button type="button" onClick={handleClick}>
        Add to cart
      </button>
    </div>
  );
}

export default ProductCard;
