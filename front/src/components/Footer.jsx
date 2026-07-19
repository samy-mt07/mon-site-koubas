import React from "react";
import { Mail } from "lucide-react";
import "./Footer.css";

// TODO: remplace ces valeurs par tes vraies coordonnées avant la mise en ligne.
const CONTACT_EMAIL = "contact@aurassens.shop";
const SOCIAL_LINKS = [
  { label: "Instagram", href: "https://instagram.com/aurascents" },
  { label: "TikTok", href: "https://tiktok.com/@aurascents" },
  { label: "Facebook", href: "https://facebook.com/aurascents" },
];

function Footer() {
  return (
    <footer className="siteFooter" id="contact">
      <div className="siteFooterInner">
        <div className="siteFooterBrand">
          <span className="siteFooterLogo">AURA SCENTS</span>
          <p>Diffuseurs de parfum d'exception, faits pour sublimer votre intérieur.</p>
        </div>

        <div className="siteFooterBlock">
          <h3>Contact</h3>
          <a href={`mailto:${CONTACT_EMAIL}`} className="siteFooterEmail">
            <Mail size={16} />
            {CONTACT_EMAIL}
          </a>
        </div>

        <div className="siteFooterBlock">
          <h3>Suivez-nous</h3>
          <div className="siteFooterSocials">
            {SOCIAL_LINKS.map((social) => (
              <a
                key={social.label}
                href={social.href}
                target="_blank"
                rel="noopener noreferrer"
              >
                {social.label}
              </a>
            ))}
          </div>
        </div>
      </div>

      <div className="siteFooterBottom">
        <span>&copy; {new Date().getFullYear()} Aura Scents. Tous droits réservés.</span>
      </div>
    </footer>
  );
}

export default Footer;
