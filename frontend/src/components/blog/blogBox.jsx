import React from "react";

import "./blogBox.scss";

const BlogBox = (props) => (
  <div className="blog__box">
    <div className="blog__image">
      <img src={props.article.image} alt={props.article.title || "blog story"} />
      <div className="blog__hover flex-center">
        <h4 className="font30 weight800">READ MORE</h4>
      </div>
    </div>
    <div className="blog__info">
      <div>
        <h4 className="font15 weight800">{props.article.title}</h4>
        <p className="font12 weight500 padding10">{props.article.description}</p>
      </div>
      <p className="font12 weight500">{props.article.date}</p>
    </div>
  </div>
);

export default BlogBox; // CHANGED: keep PascalCase name
