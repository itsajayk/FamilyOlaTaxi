import React from "react";
import { Row, Col } from "react-flexbox-grid";
import { Link } from "react-scroll";
import "./footer.scss";

import Logo from '../../assets/footer/logo.svg';
import Arrow from '../../assets/footer/arrow.svg';

// icons for fixed buttons
import { FaWhatsapp, FaPhone } from "react-icons/fa";

const Footer = () => {
  const year = new Date().getFullYear();

  // prefilled WhatsApp message (URL encoded)
  const WA_MSG = encodeURIComponent("Hello, I'm interested in booking a ride with Family OLA taxi tours & Droptaxi.");
  const WA_LINK = `https://api.whatsapp.com/send?phone=919524735812&text=${WA_MSG}`;

  return (
    <footer className="footer">
      <div className="wrapper">
        <Row middle="xs" between="xs">
          <Col xs={12} sm={6} md={6}>
            <div className="footer-box contact">
              <div className="brand-and-contact">
                <img src={Logo} alt="Family Ola Taxi" className="footer-logo" />

                <div className="contact-info">
                  <address>
                    275/3<br />
                    Jothi Nagar<br />
                    Main Road<br />
                    Mayiladuthurai - 609001
                  </address>

                  <div className="phones">
                    <a href="tel:+919524735812" aria-label="Call 9524735812">Cell: 9524735812</a>
                    <a href="tel:+919514835812" aria-label="Call 9514835812">9514835812</a>
                    <a href="tel:+914364251877" aria-label="Call 04364 251877">04364&nbsp;251877</a>
                  </div>
                </div>
              </div>

              <p className="copyright">© {year} Family Ola Taxi — All Rights Reserved</p>
            </div>
          </Col>

          <Col xs={12} sm={6} md={6}>
            <Link to="hero" spy={true} smooth={true} offset={0} duration={500}>
              <div className="footer-box back-to-top">
                <p>BACK TO TOP</p>
                <img src={Arrow} alt="arrow" />
              </div>
            </Link>
          </Col>
        </Row>
      </div>

      {/* ---------- Fixed contact buttons (WhatsApp + Phone) ---------- */}
      <div className="fixed-contact" aria-hidden={false}>
        <a
          className="fixed-btn whatsapp"
          href={WA_LINK}
          target="_blank"
          rel="noopener noreferrer"
          aria-label="WhatsApp Family Ola 9524735812"
          title="Chat on WhatsApp — 95247 35812"
        >
          <FaWhatsapp />
        </a>

        <a
          className="fixed-btn phone"
          href="tel:+919524735812"
          aria-label="Call Family Ola 9524735812"
          title="Call 95247 35812"
        >
          <FaPhone />
        </a>
      </div>
      {/* ------------------------------------------------------------- */}
    </footer>
  );
};

export default Footer;
