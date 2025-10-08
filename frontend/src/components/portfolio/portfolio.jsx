import React from "react";
import { Row, Col } from "react-flexbox-grid";
import Masonry from "react-masonry-css";
//Scss
import "./portfolio.scss";
//Assets
import Arrow from "../../assets/portfolio/arrow.svg";
import Preview1 from "../../assets/portfolio/project01/preview-01.jpg";
import Preview2 from "../../assets/portfolio/project02/preview-02.jpg";
import Preview3 from "../../assets/portfolio/project03/preview-03.jpg";
import Preview4 from "../../assets/portfolio/project04/preview-04.jpg";
import Preview5 from "../../assets/portfolio/project05/preview-05.jpg";
import Preview6 from "../../assets/portfolio/project06/preview-06.webp";
//Components
import Button from "../ui-components/button/button";
import Title from "../ui-components/title/title";
import ProjectBox from "../ui-components/projectBox/projectBox";

class Portfolio extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      // FLEET PROJECTS (only text changed)
      projects: [
        {
          id: "1",
          preview: Preview1,
          title: "Sedan - Comfort",
          tag: "sedan",
        },
        {
          id: "2",
          preview: Preview2,
          title: "SUV - Family",
          tag: "suv",
        },
        {
          id: "3",
          preview: Preview3,
          title: "Hatchback - Economy",
          tag: "sedan",
        },
        {
          id: "4",
          preview: Preview4,
          title: "Tempo Traveller",
          tag: "outstation",
        },
        {
          id: "5",
          preview: Preview5,
          title: "Airport Transfer",
          tag: "outstation",
        },
        {
          id: "6",
          preview: Preview6,
          title: "Premium Sedan",
          tag: "suv",
        },
      ],
      // PORTFOLIO GALLERY WILL LOAD THIS AFTER FUNCTION "filterGallery" FINISH FILTERING
      filterResult: null,
      pickedFilter: "all",
      filterMenuActive: false,
      pickedFilterDropdown: "NEWEST"
    };
  }

  // FIRST LOAD
  componentDidMount() {
    this.filterGallery("all");
  }

  //FILTER GALLERY FUNCTION (logic unchanged)
  filterGallery = (target) => {
    let projectsArr = [...this.state.projects];
    let result;

    if (target !== "all") {
      result = projectsArr.filter((project) => project.tag === target);
    } else {
      result = projectsArr;
    }

    this.setState({ filterResult: result, pickedFilter: target, pickedFilterDropdown: "NEWEST" });
  };

  // FILTER DROP DOWN HOVER MENU FUNCTION
  filterMenuHover = (event) => {
    if(event) {
      this.setState({ filterMenuActive: true });
    }else {
      this.setState({ filterMenuActive: false });
    }
  }

  // FILTER DROP DOWN HANDLER
  filterDropDownHandler = (filter) => {
    this.setState({ pickedFilterDropdown: filter, filterMenuActive: false });

    let projectsArr = [...this.state.filterResult];
    let result;

    if (filter === "NEWEST") {
      result = projectsArr.sort((a, b) => (a.id > b.id ? 1 : -1));
    }else if (filter === "OLDEST") {
      result = projectsArr.sort((a, b) => (a.id > b.id ? 1 : -1)).reverse();
    }

    this.setState({ filterResult: result});
  }

  // RENDER
  render() {
    // PORTFOLIO GALLERY RENDER
    let projectsRender = null;
    if (this.state.filterResult) {
      projectsRender = this.state.filterResult.map((project) => (
        <ProjectBox preview={project.preview} key={project.id} title={project.title} tag={project.tag} />
      ));
    }
    // PORTFOLIO GALLERY BREAKPOINTS
    const portfolioBreakpoints = {
      default: 3,
      1100: 3,
      700: 2,
      500: 1,
    };
    // PORTFOLIO FILTER DROPDOWN MENY RENDER
    let filterDroppDown = null;
    if(this.state.filterMenuActive) {
      filterDroppDown = (
        <div className="portfolio__filter-menu shadow">
          <p className="font12" onClick={() => this.filterDropDownHandler("NEWEST")}>
            NEWEST
          </p>
          <p className="font12" onClick={() => this.filterDropDownHandler("OLDEST")}>
            OLDEST
          </p>
        </div>
      );
    }

    return (
      <div id="portfolio">
        <div className="wrapper">
          <Title title="OUR FLEET." />
          <Row>
            <Col xs={12} sm={12} md={8} lg={9}>
              <div className="portfolio__nav">
                <ul>
                  <li className={this.state.pickedFilter === "all" ? "portfolio__nav-active font12" : "font12"} onClick={() => this.filterGallery("all")}>
                    ALL
                  </li>
                  <li
                    className={this.state.pickedFilter === "sedan" ? "portfolio__nav-active font12" : "font12"}
                    onClick={() => this.filterGallery("sedan")}
                  >
                    SEDAN
                  </li>
                  <li
                    className={this.state.pickedFilter === "suv" ? "portfolio__nav-active font12" : "font12"}
                    onClick={() => this.filterGallery("suv")}
                  >
                    SUV
                  </li>
                  <li className={this.state.pickedFilter === "outstation" ? "portfolio__nav-active font12" : "font12"} onClick={() => this.filterGallery("outstation")}>
                    OUTSTATION
                  </li>
                </ul>
              </div>
            </Col>
            <Col xs={12} sm={12} md={4} lg={3}>
              <div className="portfolio__filter" onMouseEnter={() => this.filterMenuHover(true)} onMouseLeave={() => this.filterMenuHover(false)}>
                <p className="font12">{this.state.pickedFilterDropdown} FIRST</p>
                <img src={Arrow} alt="arrow" />
                {filterDroppDown}
              </div>
            </Col>
          </Row>
          <Masonry breakpointCols={portfolioBreakpoints} className="my-masonry-grid" columnClassName="mint__gallery">
            {projectsRender}
          </Masonry>
          <Row className="flex-center padding40">
            <Button label="BOOK A RIDE" target={"contact"} />
          </Row>
        </div>
      </div>
    );
  }
}

export default Portfolio;
