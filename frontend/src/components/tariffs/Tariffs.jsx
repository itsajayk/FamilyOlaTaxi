import React, { useState } from "react";
import { Row, Col } from "react-flexbox-grid";
import Title from "../ui-components/title/title";
import "./tariffs.scss";

// Replace the imports below with the actual car images in your project
import Car01 from "../../assets/portfolio/project01/Sedan.jpg";
import Car02 from "../../assets/portfolio/project02/preview-02.jpg";
import Car03 from "../../assets/portfolio/project03/preview-03.jpg";
import Car04 from "../../assets/portfolio/project06/innova.webp";

const vehicles = [
  {
    id: "sedan",
    name: "Sedan",
    img: Car01,
    oneway: { perKm: 14, driverBatta: 400, hillStation: 400, waiting: 150 },
    round: { perKm: 13, driverBatta: 400, hillStation: 400, waiting: 150 },
  },
  {
    id: "suv",
    name: "SUV",
    img: Car02,
    oneway: { perKm: 18, driverBatta: 500, hillStation: 500, waiting: 200 },
    round: { perKm: 18, driverBatta: 500, hillStation: 500, waiting: 200 },
  },
  {
    id: "innova",
    name: "Innova",
    img: Car03,
    oneway: { perKm: 20, driverBatta: 500, hillStation: 500, waiting: 200 },
    round: { perKm: 19, driverBatta: 500, hillStation: 500, waiting: 200 },
  },
  {
    id: "innova-crysta",
    name: "Innova Crysta",
    img: Car04,
    oneway: { perKm: 26, driverBatta: 600, hillStation: 600, waiting: 250 },
    round: { perKm: 23, driverBatta: 600, hillStation: 600, waiting: 250 },
  },
];

const Tariffs = () => {
  const [tab, setTab] = useState("oneway"); // 'oneway' or 'round'
  const minKms = tab === "oneway" ? 130 : 250;

  return (
    <div id="tariffs" className="tariffs-page">
      <div className="wrapper">
        <Title title="TARIFFS" />
        <div className="tariffs-controls">
          <div className="tabs">
            <button
              className={tab === "oneway" ? "active" : ""}
              onClick={() => setTab("oneway")}
            >
              One Way Tariffs
            </button>
            <button
              className={tab === "round" ? "active" : ""}
              onClick={() => setTab("round")}
            >
              Round Trip Tariffs
            </button>
          </div>

          <div className="min-kms">Minimum {minKms}kms</div>
        </div>

        <div className="tariff-list">
          {vehicles.map((v) => {
            const rates = tab === "oneway" ? v.oneway : v.round;
            return (
              <div className="tariff-card" key={v.id}>
                <div className="tariff-left">
                  <img src={v.img} alt={v.name} />
                </div>

                <div className="tariff-right">
                  <div className="tariff-header">
                    <h3>{v.name}</h3>
                  </div>

                  <div className="tariff-details">
                    <div className="detail-row">
                      <span className="label">Per Km</span>
                      <span className="value">₹{rates.perKm}.00 /Km</span>
                    </div>
                    <div className="detail-row">
                      <span className="label">Driver Batta</span>
                      <span className="value">₹{rates.driverBatta}.00</span>
                    </div>
                    <div className="detail-row">
                      <span className="label">Hill Station</span>
                      <span className="value">₹{rates.hillStation}.00</span>
                    </div>
                    <div className="detail-row">
                      <span className="label">Waiting</span>
                      <span className="value">₹{rates.waiting}.00 /Hour</span>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default Tariffs;
