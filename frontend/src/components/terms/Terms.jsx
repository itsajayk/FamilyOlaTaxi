import React from "react";
import Title from "../ui-components/title/title";
import "./terms.scss";

const TERMS = [
  {
    id: 1,
    text: "For Sedan model cars - Maximum 4 passenger capacity and 3 bags are permitted.",
  },
  {
    id: 2,
    text: "For SUV model cars - Maximum 7 passenger capacity and 3 bags are permitted.",
  },
  {
    id: 3,
    text: "Minimum 130 kms coverage for One Way trips.",
  },
  {
    id: 4,
    text: "Minimum 250 kms coverage for Round Trip.",
  },
  {
    id: 5,
    text: "No extra charge for tea and food breaks taken during running time.",
  },
  {
    id: 6,
    text: "Waiting charges per hour — Sedan: ₹150 | SUV: ₹200 | Innova: ₹200 | Innova Crysta: ₹250 (applies during trip).",
  },
  {
    id: 7,
    text: "Luggage load in carrier: ₹400 (if mentioned in quotation).",
  },
  {
    id: 8,
    text: "EOT is calculated on running km. Toll by FASTag and all other running costs are included in EOT calculations where applicable.",
  },
  {
    id: 9,
    text: "Toll fees, interstate permits, hill charges, and pet charges (if any) are extra and payable by the customer.",
  }
];

const Terms = () => {
  const handlePrint = () => {
    window.print();
  };

  return (
    <main id="terms" className="terms-page" role="main" aria-label="Terms and Conditions">
      <div className="wrapper">
        <Title title="TERMS &amp; CONDITIONS" />
        <div className="terms-layout">
          <aside className="terms-side" aria-hidden="false">
            <div className="summary">
              <h3>Important Summary</h3>
              <p>
                Please read these terms carefully before booking. The tariffs shown on the site do not
                include certain statutory or route-based charges (toll, permits, hill charges).
              </p>
              <ul className="quick-list">
                <li><strong>One Way Min:</strong> 130 kms</li>
                <li><strong>Round Trip Min:</strong> 250 kms</li>
                <li><strong>Contact:</strong> 95247 35812 / 95148 35812</li>
              </ul>
              <div className="actions">
                <button className="btn primary" onClick={() => window.location.href = "#contact"}>
                  Enquire / Book
                </button>
                {/* <button className="btn ghost" onClick={handlePrint}>
                  Print Terms
                </button> */}
              </div>
            </div>
          </aside>

          <section className="terms-content" aria-labelledby="termsHeading">
            <h2 id="termsHeading" className="sr-only">Terms and Conditions</h2>

            <div className="terms-card">
              <h4 className="card-title">Terms and Conditions</h4>

              <ol className="terms-list">
                {TERMS.map((t) => (
                  <li key={t.id} className="terms-item">
                    <span className="term-text">{t.text}</span>
                  </li>
                ))}
              </ol>

              <div className="notes">
                <p><strong>Notes:</strong></p>
                <ul>
                  <li>Driver allowances, night charges (if any), and extra charges for special requests will be communicated at the time of quotation.</li>
                  <li>Any damages caused to the vehicle due to negligence or misuse will be charged to the customer.</li>
                  <li>Confirm baggage details at time of booking if you request a carrier; additional charges may apply.</li>
                </ul>
              </div>
            </div>
          </section>
        </div>
      </div>
    </main>
  );
};

export default Terms;
