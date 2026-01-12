function Footer() {
  return (
    <footer className="footer">
      <div className="footer-container">
        {/* Colonne 1 : Branding */}
        <div className="footer-section">
          <h2 className="footer-logo">KOUBAS SHOP</h2>
          <p className="footer-text">
            High quality fragrances & diffusers, crafted with passion.
          </p>
        </div>

        {/* Colonne 2 : Liens */}
        <div className="footer-section">
          <h3 className="footer-title">Navigation</h3>
          <ul className="footer-links">
            <li>
              <a href="/">Home</a>
            </li>
            <li>
              <a href="/products">Products</a>
            </li>
            <li>
              <a href="/cart">Cart</a>
            </li>
            <li>
              <a href="/contact">Contact</a>
            </li>
          </ul>
        </div>

        {/* Colonne 3 : Réseaux */}
        <div className="footer-section">
          <h3 className="footer-title">Follow us</h3>

          <div className="footer-socials">
            <a href="#" className="social-icon">
              📘
            </a>
            <a href="#" className="social-icon">
              📸
            </a>
            <a href="#" className="social-icon">
              🐦
            </a>
            <a href="#" className="social-icon">
              🎥
            </a>
          </div>
        </div>
      </div>

      <div className="footer-bottom">
        © {new Date().getFullYear()} KOUBAS SHOP — All rights reserved.
      </div>
    </footer>
  );
}

export default Footer;
