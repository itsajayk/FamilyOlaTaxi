import React from "react";
import { Row, Col } from "react-flexbox-grid";
import { Link } from "react-scroll";
import "./footer.scss";

import Logo from '../../assets/footer/logo.svg';
import Arrow from '../../assets/footer/arrow.svg';

const Footer = () => {
  const year = new Date().getFullYear();

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
    </footer>
  );
};

export default Footer;