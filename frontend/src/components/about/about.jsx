import React from "react";
import { Row, Col } from "react-flexbox-grid";
import "./about.scss";
// Components
import TeamBox from './teamBox';
import TeamInfo from "./teamInfo";
import Title from "../ui-components/title/title";
// Assets
import Person01 from "../../assets/about/ola-ad.jpg";
import Person02 from "../../assets/about/ola-ad2.jpg";

const about = () => (
  <div id="about">
    <div className="wrapper">
      <Title title="ABOUT US." />
      <p className="font12">
              Family OLA taxi tours & Droptaxi. is your trusted local travel partner based in
        <strong> Mayiladuthurai</strong>, offering safe, reliable, and
        comfortable rides for individuals and families. With years of service
        excellence, we specialize in both in-town and outstation trips,
        ensuring every journey is smooth and punctual.
      </p>
      <Row>
        <Col md={12} lg={4}>
          <TeamBox avatar={Person01}  />
        </Col>
        <Col md={12} lg={4}>
          <TeamBox avatar={Person02}  />
        </Col>
        <Col md={12} lg={4}>
          <TeamInfo />
        </Col>
      </Row>
    </div>
  </div>
);

export default about;
