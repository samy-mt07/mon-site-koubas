// function ProductCard(props) {
//   const product = props.product;

//   // Ton API renvoie price_cents (ex: 2499)
//   const price =
//     product.price_cents != null ? Number(product.price_cents) / 100 : 0;

//   function handleClick() {
//     if (props.onAddToCart) {
//       // On passe un produit avec un champ `price` déjà en euros/dollars
//       props.onAddToCart({
//         ...product,
//         price: price, // 24.99 par exemple
//       });
//     }
//   }

//   return (
//     <div>
//       <h3>{product.name}</h3>
//       <img src={product.image_url} alt={product.name} width="200" />
//       <p>Price: {price.toFixed(2)}</p>
//       <button type="button" onClick={handleClick}>
//         Add to cart
//       </button>
//     </div>
//   );
// }

// export default ProductCard;
import { Card, Button } from "react-bootstrap";

function ProductCard(props) {
  const product = props.product;

  // Conversion cents → dollars
  const price =
    product.price_cents != null ? Number(product.price_cents) / 100 : 0;

  function handleClick() {
    if (props.onAddToCart) {
      props.onAddToCart({
        ...product,
        price: price,
      });
    }
  }

  return (
    <Card
      style={{
        width: "18rem",
      }}
      className="shadow-sm mb-4"
    >
      {product.image_url && (
        <Card.Img
          variant="top"
          src={product.image_url}
          alt={product.name}
          // style={{ height: "220px", objectFit: "cover" }}
        />
      )}

      <Card.Body>
        <Card.Title>{product.name}</Card.Title>

        <Card.Text>
          <strong>Price:</strong> ${price.toFixed(2)}
        </Card.Text>

        <Button id="btn-ajouter-panier" variant="primary" onClick={handleClick}>
          Add to Cart
        </Button>
      </Card.Body>
    </Card>
  );
}

export default ProductCard;
