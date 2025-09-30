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

class Blog extends React.Component {
  state = {
    // LIST ARRAY OF BLOG STORIES
    stories: [
      {
        image: Preview01,
        id: "1",
        title: "SUPER BLOG ARTICLE!",
        description: "Lorem ipsum dolor sit amet, consectetur undo thes tabore et dolore magna aliqua.",
        date: "21 April 2020",
      },
      {
        image: Preview02,
        id: "2",
        title: "AWESOME ARTICLE!",
        description: "Lorem ipsum dolor undo thes tabore et dolore magna aliqua.",
        date: "27 April 2020",
      },
      {
        image: Preview03,
        id: "3",
        title: "SUPER TITLE!",
        description: "Lorem tabore et dolore magna aliqua ipsum dolor undo thes.",
        date: "03 May 2020",
      },
      {
        image: Preview04,
        id: "4",
        title: "BLOG TITLE!",
        description: "Lorem tabore et dolore magna aliqua ipsum dolor undo thes.",
        date: "15 May 2020",
      },
      {
        image: Preview05,
        id: "5",
        title: "BLOG ARTICLE!",
        description: "Lorem tabore et dolore magna aliqua ipsum dolor undo thes.",
        date: "20 May 2020",
      },
      {
        image: Preview06,
        id: "6",
        title: "AWESOME TITLE!",
        description: "Lorem tabore et dolore magna aliqua ipsum dolor undo thes.",
        date: "23 May 2020",
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
          <Title title="OUR BLOG." />
          <p className="font12">
            Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt<br />ut labore et dolore magna aliqua.
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
