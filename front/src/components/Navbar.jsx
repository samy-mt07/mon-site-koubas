import { useContext } from "react";
import { Link } from "react-router-dom";

import { AuthContext } from "../context/AuthContext";
import { CartContext } from "../context/CartContext";

// Bootstrap
import Button from "react-bootstrap/Button";
import Container from "react-bootstrap/Container";
import Nav from "react-bootstrap/Nav";
import Navbar from "react-bootstrap/Navbar";
import NavDropdown from "react-bootstrap/NavDropdown";
import Form from "react-bootstrap/Form";

function NavBarStyled() {
  const auth = useContext(AuthContext);
  const cart = useContext(CartContext);

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
    <Navbar expand="lg" bg="light" className="mb-4 shadow-sm">
      <Container fluid>
        {/* Logo */}
        <Navbar.Brand as={Link} to="/">
          KOUBAS SHOP
        </Navbar.Brand>

        <Navbar.Toggle aria-controls="navbarScroll" />

        <Navbar.Collapse id="navbarScroll">
          {/* Liens Navigation */}
          <Nav className="me-auto my-2 my-lg-0" navbarScroll>
            <Nav.Link as={Link} to="/">
              Home
            </Nav.Link>

            <Nav.Link as={Link} to="/cart">
              Cart ({totalItems})
            </Nav.Link>

            <NavDropdown title="Products" id="navbarScrollingDropdown">
              <NavDropdown.Item as={Link} to="/">
                Parfums
              </NavDropdown.Item>
              <NavDropdown.Item as={Link} to="/">
                Diffusers
              </NavDropdown.Item>

              <NavDropdown.Divider />

              <NavDropdown.Item as={Link} to="/">
                All Products
              </NavDropdown.Item>
            </NavDropdown>
          </Nav>

          {/* Barre de recherche
          <Form className="d-flex me-3">
            <Form.Control
              type="search"
              placeholder="Search..."
              className="me-2"
            />
            <Button variant="outline-success">Search</Button>
          </Form> */}

          {/* Auth */}
          {auth && auth.user ? (
            <div className="d-flex align-items-center">
              <span className="me-3">
                Hello <b>{auth.user.full_name}</b>
              </span>
              <Button variant="danger" size="sm" onClick={handleLogout}>
                Logout
              </Button>
            </div>
          ) : (
            <div>
              <Button
                as={Link}
                to="/login"
                variant="primary"
                size="sm"
                className="me-2"
              >
                Login
              </Button>
              <Button as={Link} to="/register" variant="secondary" size="sm">
                Singup
              </Button>
            </div>
          )}
        </Navbar.Collapse>
      </Container>
    </Navbar>
  );
}

export default NavBarStyled;
