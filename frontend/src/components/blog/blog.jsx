import React from "react";
// Removed Swiper import and params — using CSS Grid instead. /* CHANGED */
// import Swiper from "react-id-swiper"; // CHANGED - removed
// import 'swiper/css' // CHANGED - removed

// SCSS
import "./blog.scss";
// Assets
import Preview01 from "../../assets/blog/story01/preview.png";
import Preview02 from "../../assets/blog/story02/preview.png";
import Preview03 from "../../assets/blog/story03/preview.png";
import Preview04 from "../../assets/blog/story04/preview.png";
import Preview05 from "../../assets/blog/story05/preview.png";
import Preview06 from "../../assets/blog/story06/preview.png";
// Components
import Title from "../ui-components/title/title";
import BlogBox from "./blogBox";
import {
  FaClock,
  FaTaxi,
  FaRoad,
  FaPlane,
  FaAmbulance,
  FaHourglassHalf,
  FaArrowRight,
  FaExchangeAlt,
  FaMapMarkedAlt
} from "react-icons/fa";

class Blog extends React.Component {
  state = {
  stories: [
    {
      id: "1",
      icon: FaClock,
      title: "24x7 Cab Booking Services",
      description: "Whether it’s early morning or late night, our cabs are always ready to go.",
      date: "",
    },
    {
      id: "2",
      icon: FaTaxi,
      title: "Local City Rides",
      description: "Quick and comfortable trips within the city, anytime you need.",
      date: "",
    },
    {
      id: "3",
      icon: FaRoad,
      title: "Outstation Rides",
      description: "Safe and affordable long-distance travel to your favourite destinations.",
      date: "",
    },
    {
      id: "4",
      icon: FaPlane,
      title: "Airport Transfers",
      description: "On-time pick-up and drop service for hassle-free airport travel.",
      date: "",
    },
    {
      id: "5",
      icon: FaAmbulance,
      title: "Medical Trips",
      description: "10% concession on the overall fare for medical-related trips.",
      date: "",
    },
    {
      id: "6",
      icon: FaHourglassHalf,
      title: "Hourly Rental",
      description: "Book a cab by the hour and travel freely to multiple stops.",
      date: "",
    },
    {
      id: "7",
      icon: FaArrowRight,
      title: "One-Way Trips",
      description: "Pay only for the distance you travel with our economical one-way service.",
      date: "",
    },
    {
      id: "8",
      icon: FaExchangeAlt,
      title: "Round Trips",
      description: "Convenient return rides for your day-long or weekend travel plans.",
      date: "",
    },
    {
      id: "9",
      icon: FaMapMarkedAlt,
      title: "Tour Packages",
      description: "Explore nearby attractions with our curated sightseeing and holiday cab packages.",
      date: "",
    },
  ],
};


  render() {
    // BLOG STORIES RENDER
    let storiesRender = null;
    if (this.state.stories) {
      storiesRender = this.state.stories.map((story) => (
        // CHANGED: render BlogBox directly inside CSS grid cell
        <BlogBox article={story} key={story.id} />
      ));
    }

    return (
      <div className="blog" id="blog">
        <div className="wrapper">
          <Title title="Our Services" />
          <p className="font12">
            Welcome to Family OLA taxi tours & Droptaxi, your trusted travel
            partner for every journey. We offer reliable, safe, and affordable cab
            services across the city and beyond. Book instantly and enjoy
            comfortable rides with professional drivers — anytime, anywhere.
          </p>
          <div className="padding30">
            {/* CHANGED: replaced Swiper with responsive CSS Grid */}
            <div className="blog-grid">
              {storiesRender}
            </div>
          </div>
        </div>
      </div>
    );
  }
}

export default Blog;
