// src/components/ticker/TickerPortal.jsx
import React, { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import "./ticker-portal.scss";

const messages = [
  "One Way trip, One way tariff!",
  "We have experienced drivers",
  "Neat and Clean Cabs",
  "All Over South India Available",
  "24x7 Taxi Service Available",
  "Your Journey Our Priority",
  "www.thanjaidroptaxi.com",
  "Pets Drop Available",
];

const TickerPortal = () => {
  const el = typeof document !== "undefined" ? document.createElement("div") : null;
  const trackRef = useRef(null);
  const [mounted, setMounted] = useState(false);

  // Create portal root and append
  useEffect(() => {
    if (!el) return;
    el.className = "portal-ticker-root";
    document.body.prepend(el); // put it at the very top
    setMounted(true);

    // cleanup
    return () => {
      // remove padding we added
      document.body.style.paddingTop = "";
      if (el && el.parentNode) el.parentNode.removeChild(el);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // after mounted, measure height and set body padding-top
  useEffect(() => {
    if (!mounted) return;
    const node = el;
    const updatePadding = () => {
      const h = node.getBoundingClientRect().height || 0;
      // add safe-area inset too
      const safe = parseInt(getComputedStyle(document.documentElement).getPropertyValue("--safe-area-bottom"), 10) || 0;
      document.body.style.paddingTop = `${h}px`;
    };

    // set padding immediately and on window resize
    updatePadding();
    window.addEventListener("resize", updatePadding);
    return () => window.removeEventListener("resize", updatePadding);
  }, [mounted, el]);

  if (!el) return null;

  const ticker = (
    <div
      className="portal-ticker"
      role="region"
      aria-label="site announcements"
      onTouchStart={(e) => e.currentTarget.classList.add("paused")}
      onTouchEnd={(e) => e.currentTarget.classList.remove("paused")}
    >
      <div className="portal-ticker__inner">
        <div className="portal-ticker__track" ref={trackRef}>
          {messages.concat(messages).map((m, i) => (
            <span className="portal-ticker__item" key={i}>
              {m}
            </span>
          ))}
        </div>
      </div>
    </div>
  );

  return createPortal(ticker, el);
};

export default TickerPortal;
