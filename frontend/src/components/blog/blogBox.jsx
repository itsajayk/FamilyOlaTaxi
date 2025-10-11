// BlogBox.jsx
import React from "react";
import "./blogBox.scss";

/**
 * Props:
 *  - article.image  -> image path or null
 *  - article.icon   -> react-icon component (e.g. FaRoad) or undefined
 *  - article.title
 *  - article.description
 *  - article.date
 */
const BlogBox = (props) => {
  const { article } = props;
  const Icon = article.icon || null;

  return (
    <div className="blog__box">
      <div className={`blog__media ${Icon ? "has-icon" : ""}`}>
        {article.image ? (
          <img src={article.image} alt={article.title || "blog story"} />
        ) : Icon ? (
          <div className="icon-badge" aria-hidden="true">
            <Icon className="badge-icon" />
          </div>
        ) : null}

        <div className="blog__hover flex-center">
          <h4 className="font30 weight800">READ MORE</h4>
        </div>
      </div>

      <div className="blog__info">
        <div>
          <h4 className="font15 weight800">{article.title}</h4>
          <p className="font12 weight500 padding10">{article.description}</p>
        </div>
        {article.date ? <p className="font12 weight500">{article.date}</p> : null}
      </div>
    </div>
  );
};

export default BlogBox;
