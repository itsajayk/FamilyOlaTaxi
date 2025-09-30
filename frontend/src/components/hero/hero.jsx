// frontend/src/components/hero/hero.jsx
import React, { useEffect, useState, useRef } from "react";
import axios from "axios";
import L from "leaflet";
import { motion, AnimatePresence } from "framer-motion";
import Button from "../ui-components/button/button";
import "../../style/App.scss";
import "./hero.scss";

// images
import HeroImage1 from "../../assets/hero/taxi.jpg";
import HeroImage2 from "../../assets/hero/taxi-car.jpeg";
import HeroImage3 from "../../assets/hero/car-taxi-2.jpg";
import HeroImage4 from "../../assets/hero/car-hero.jpg";

// leaflet marker assets
import markerIcon2x from "leaflet/dist/images/marker-icon-2x.png";
import markerIcon from "leaflet/dist/images/marker-icon.png";
import markerShadow from "leaflet/dist/images/marker-shadow.png";

// configure default icon
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: markerIcon2x,
  iconUrl: markerIcon,
  shadowUrl: markerShadow,
});

// PHOTON + Nominatim helpers (paste near top of hero.jsx)
const TN_BBOX = '76.0,7.8,80.5,13.5'; // minLon,minLat,maxLon,maxLat (Photon expects bbox=minLon,minLat,maxLon,maxLat)

// photon search -> normalized results
async function photonSearch(q, bbox = TN_BBOX, limit = 6) {
  if (!q) return [];
  const bboxQuery = bbox ? `&bbox=${encodeURIComponent(bbox)}` : '';
  const url = `https://photon.komoot.io/api/?q=${encodeURIComponent(q)}&limit=${limit}&lang=en${bboxQuery}`;
  try {
    const res = await fetch(url);
    const json = await res.json();
    const features = json.features || [];
    return features.map(f => {
      // construct friendly display name
      const props = f.properties || {};
      const name = props.name || '';
      const city = props.city || props.town || props.village || '';
      const state = props.state || '';
      const country = props.country || '';
      const display = name ? `${name}${city ? ', ' + city : ''}${state ? ', ' + state : ''}` : (props.label || `${city}${state ? ', ' + state : ''}`);
      return {
        display_name: display || props.label || country,
        lat: f.geometry.coordinates[1],
        lon: f.geometry.coordinates[0],
        type: props.osm_key || props.class || '',
        place_id: props.osm_id || f.id
      };
    });
  } catch (err) {
    console.warn('Photon search failed', err);
    return [];
  }
}

// nominatim bounded TN fallback
async function nominatimSearchTN(q, limit = 6) {
  if (!q) return [];
  const viewbox = '76.0,13.5,80.5,7.8'; // note: Nominatim viewbox uses lon_left,lat_top,lon_right,lat_bottom
  const url = `https://nominatim.openstreetmap.org/search?format=json&addressdetails=1&limit=${limit}&viewbox=${encodeURIComponent(viewbox)}&bounded=1&countrycodes=IN&q=${encodeURIComponent(q)}&accept-language=en`;
  try {
    const res = await fetch(url);
    const data = await res.json();
    return (data || []).map(d => ({
      display_name: d.display_name,
      lat: parseFloat(d.lat),
      lon: parseFloat(d.lon),
      type: d.type || d.class || '',
      place_id: d.place_id || d.osm_id || (d.lat + ',' + d.lon)
    }));
  } catch (err) {
    console.warn('Nominatim TN search failed', err);
    return [];
  }
}


/* ---------------- MapPicker (plain Leaflet) ---------------- */
const MapPicker = ({ initialPos = [11.0, 78.0], onSelect, closeModal }) => {
  const mapRef = useRef(null);
  const containerRef = useRef(null);
  const initTimeoutRef = useRef(null);
  const [markerPos, setMarkerPos] = useState(null);
  const [address, setAddress] = useState("");
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);

  // create map after small delay so modal animation completes
  useEffect(() => {
    if (!containerRef.current) return;

    // small delay ensures modal/animation has revealed container (fixes tiles not showing)
    initTimeoutRef.current = setTimeout(() => {
      mapRef.current = L.map(containerRef.current, {
        center: initialPos,
        zoom: 12,
        attributionControl: false,
      });

      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: "&copy; OpenStreetMap contributors",
        maxZoom: 19,
      }).addTo(mapRef.current);

      // ensure tiles repaint properly
      setTimeout(() => {
        try { mapRef.current.invalidateSize(); } catch (e) {}
      }, 150);

      const onMapClick = async (e) => {
        const lat = e.latlng.lat;
        const lng = e.latlng.lng;
        setMarkerOnMap([lat, lng]);
        const addr = await reverseGeocode(lat, lng);
        setAddress(addr);
        setResults([]);
      };
      mapRef.current.on("click", onMapClick);

      // cleanup
      return () => {
        mapRef.current.off("click", onMapClick);
        try { mapRef.current.remove(); } catch (e) {}
        mapRef.current = null;
      };
    }, 120);

    return () => {
      clearTimeout(initTimeoutRef.current);
      if (mapRef.current) {
        try { mapRef.current.remove(); } catch {}
        mapRef.current = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [containerRef]);

  // helper to add marker
  const setMarkerOnMap = (pos) => {
    setMarkerPos(pos);
    if (!mapRef.current) return;
    // remove old marker
    if (mapRef.current._markerLayer) {
      try { mapRef.current.removeLayer(mapRef.current._markerLayer); } catch (e) {}
      mapRef.current._markerLayer = null;
    }
    const m = L.marker(pos).addTo(mapRef.current);
    mapRef.current._markerLayer = m;
    try { mapRef.current.setView(pos, Math.max(13, mapRef.current.getZoom())); } catch {}
    // ensure layout
    setTimeout(() => { try { mapRef.current.invalidateSize(); } catch (e) {} }, 120);
  };

  // reverse geocode
  const reverseGeocode = async (lat, lon) => {
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lon}&format=json`
      );
      const data = await res.json();
      return data.display_name || `${lat.toFixed(5)}, ${lon.toFixed(5)}`;
    } catch {
      return `${lat.toFixed(5)}, ${lon.toFixed(5)}`;
    }
  };

  // forward geocode (search)
  // replace MapPicker.doSearch with this
const TAMIL_VIEWBOX = '76.0,13.5,80.5,7.8';

const doSearch = async (q) => {
  if (!q) {
    setResults([]);
    return;
  }

  // 1) Photon (restricted by bbox to Tamil Nadu)
  const photonResults = await photonSearch(q, TN_BBOX, 6);
  if (photonResults && photonResults.length) {
    setResults(photonResults);
    return;
  }

  // 2) fallback: Nominatim bounded to Tamil Nadu
  const nomResults = await nominatimSearchTN(q, 6);
  if (nomResults && nomResults.length) {
    setResults(nomResults);
    return;
  }

  // 3) final fallback: global photon (no bbox)
  const photonGlobal = await photonSearch(q, null, 6);
  setResults(photonGlobal);
};


  const selectResult = (r) => {
    const lat = parseFloat(r.lat);
    const lon = parseFloat(r.lon);
    setMarkerOnMap([lat, lon]);
    setAddress(r.display_name || `${lat.toFixed(5)}, ${lon.toFixed(5)}`);
    setResults([]);
  };

  const confirm = () => {
    if (!markerPos) return alert("Please pick a location on the map or choose a search result.");
    onSelect({ address, lat: markerPos[0], lng: markerPos[1] });
    closeModal();
  };

  return (
    <div className="map-picker">
      <div className="map-picker-top">
        <input
          className="map-search"
          placeholder="Search address or landmark"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            doSearch(e.target.value);
          }}
        />
        <div className="map-actions">
          <button
            type="button"
            className="btn small"
            onClick={() => {
              if (!navigator.geolocation) return alert("Geolocation not supported");
              navigator.geolocation.getCurrentPosition(async (p) => {
                const lat = p.coords.latitude, lon = p.coords.longitude;
                setMarkerOnMap([lat, lon]);
                const addr = await reverseGeocode(lat, lon);
                setAddress(addr);
                setResults([]);
              }, () => alert("Unable to fetch location"));
            }}
          >
            Use My Location
          </button>
          <button
            type="button"
            className="btn small ghost"
            onClick={() => {
              setMarkerPos(null);
              setAddress("");
              setResults([]);
              if (mapRef.current && mapRef.current._markerLayer) {
                try { mapRef.current.removeLayer(mapRef.current._markerLayer); } catch {}
                mapRef.current._markerLayer = null;
              }
            }}
          >
            Clear
          </button>
        </div>
      </div>

      {results && results.length > 0 && (
        <ul className="search-results">
          {results.map((r) => (
            <li key={r.place_id} onClick={() => selectResult(r)}>
              <strong>{r.display_name.split(",").slice(0, 2).join(", ")}</strong>
              <div className="muted">{r.type} • {r.display_name.split(",").slice(-2).join(", ")}</div>
            </li>
          ))}
        </ul>
      )}

      <div className="map-wrapper" style={{ borderRadius: 12, overflow: "hidden", border: "1px solid rgba(2,6,23,0.06)" }}>
        <div style={{ height: 360 }} ref={containerRef} />
      </div>

      <div className="map-picker-footer">
        <div className="selected">
          <div className="muted">Selected:</div>
          <div>{address || <em>None</em>}</div>
        </div>
        <div className="footer-actions">
          <button type="button" className="btn ghost" onClick={() => closeModal()}>Cancel</button>
          <button type="button" className="btn primary" onClick={confirm}>Use This Location</button>
        </div>
      </div>
    </div>
  );
};

/* ---------------- BookingForm (with inline search suggestions) ---------------- */
const BookingForm = ({ className = "" }) => {
  const [tripType, setTripType] = useState("One-way");
  const [cabType, setCabType] = useState("Sedan");
  const [pickup, setPickup] = useState({ address: "", lat: null, lng: null });
  const [drop, setDrop] = useState({ address: "", lat: null, lng: null });
  const [pickupDateTime, setPickupDateTime] = useState("");
  const [loading, setLoading] = useState(false);
  const [modalFor, setModalFor] = useState(null);

  // inline search state + keyboard nav indexes
  const [pickupQuery, setPickupQuery] = useState("");
  const [dropQuery, setDropQuery] = useState("");
  const [pickupSuggestions, setPickupSuggestions] = useState([]);
  const [dropSuggestions, setDropSuggestions] = useState([]);
  const [pickupActive, setPickupActive] = useState(-1);
  const [dropActive, setDropActive] = useState(-1);

  const searchTimerRef = useRef(null);
  const API_BASE = process.env.REACT_APP_API_BASE || "/api";

  // debounced search helper (shared)
  const searchNominatim = (q, setResults) => {
  clearTimeout(searchTimerRef.current);
  if (!q) {
    setResults([]);
    return;
  }
  searchTimerRef.current = setTimeout(async () => {
    try {
      // 1) Photon (TN bbox)
      let results = await photonSearch(q, TN_BBOX, 6);
      if (results && results.length) return setResults(results);

      // 2) fallback to Nominatim TN
      results = await nominatimSearchTN(q, 6);
      if (results && results.length) return setResults(results);

      // 3) final fallback: Photon global
      results = await photonSearch(q, null, 6);
      setResults(results || []);
    } catch (err) {
      console.error("search", err);
      setResults([]);
    }
  }, 300); // debounce
};


  useEffect(() => { searchNominatim(pickupQuery, setPickupSuggestions); setPickupActive(-1); }, [pickupQuery]);
  useEffect(() => { searchNominatim(dropQuery, setDropSuggestions); setDropActive(-1); }, [dropQuery]);

  const openMap = (which) => setModalFor(which);
  const closeMap = () => setModalFor(null);

  const onMapSelect = (which, payload) => {
    if (which === "pickup") {
      setPickup(payload);
      setPickupQuery(payload.address);
      setPickupSuggestions([]);
    } else {
      setDrop(payload);
      setDropQuery(payload.address);
      setDropSuggestions([]);
    }
  };

  const onSuggestionSelect = (which, r) => {
  const lat = parseFloat(r.lat), lng = parseFloat(r.lon), addr = r.display_name;
  const payload = { address: addr, lat, lng };
    if (which === "pickup") {
      setPickup(payload); setPickupQuery(addr); setPickupSuggestions([]); setPickupActive(-1);
    } else {
      setDrop(payload); setDropQuery(addr); setDropSuggestions([]); setDropActive(-1);
    }
  };

  const validate = () => {
    if (!pickup.address || !drop.address || !pickupDateTime) {
      alert("Please fill pickup, drop and pickup date/time");
      return false;
    }
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;
    setLoading(true);
    const payload = {
      tripType, cabType,
      pickupLocation: pickup, dropLocation: drop,
      pickupDateTime, createdAt: new Date().toISOString()
    };
    try {
      const res = await axios.post(`${API_BASE.replace(/\/$/, "")}/bookings`, payload);
      alert("Booking submitted! Ref: " + (res.data._id || "n/a"));
      setPickup({ address: "", lat: null, lng: null }); setDrop({ address: "", lat: null, lng: null });
      setPickupQuery(""); setDropQuery(""); setPickupDateTime("");
    } catch (err) {
      console.error(err);
      alert("Failed to submit: " + (err.response?.data?.message || err.message));
    } finally { setLoading(false); }
  };

  // keyboard handling for pickup input
  const onPickupKeyDown = (e) => {
    if (!pickupSuggestions.length) return;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setPickupActive(idx => Math.min(idx + 1, pickupSuggestions.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setPickupActive(idx => Math.max(idx - 1, 0));
    } else if (e.key === "Enter") {
      if (pickupActive >= 0 && pickupActive < pickupSuggestions.length) {
        e.preventDefault();
        onSuggestionSelect('pickup', pickupSuggestions[pickupActive]);
      }
    } else if (e.key === "Escape") {
      setPickupSuggestions([]); setPickupActive(-1);
    }
  };

  // keyboard handling for drop input
  const onDropKeyDown = (e) => {
    if (!dropSuggestions.length) return;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setDropActive(idx => Math.min(idx + 1, dropSuggestions.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setDropActive(idx => Math.max(idx - 1, 0));
    } else if (e.key === "Enter") {
      if (dropActive >= 0 && dropActive < dropSuggestions.length) {
        e.preventDefault();
        onSuggestionSelect('drop', dropSuggestions[dropActive]);
      }
    } else if (e.key === "Escape") {
      setDropSuggestions([]); setDropActive(-1);
    }
  };

  return (
    <div>
      <motion.form className={`booking-form ${className}`} onSubmit={handleSubmit}
        initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.28 }}>

        <div className="row">
          <div className="field">
            <label>Trip Type</label>
            <select value={tripType} onChange={(e) => setTripType(e.target.value)}>
              <option>One-way</option><option>Round Trip</option><option>Local Packages</option>
            </select>
          </div>
          <div className="field">
            <label>Cab Type</label>
            <select value={cabType} onChange={(e) => setCabType(e.target.value)}>
              <option>Sedan</option><option>SUV</option><option>Innova</option>
            </select>
          </div>
        </div>

        <div className="row">
          {/* Pickup with inline search */}
        <div className="field full" style={{ position: "relative" }}>
          <label>Pick-up Location</label>
          <div className="input-with-actions">
            <input
              aria-label="Pickup address"
              aria-autocomplete="list"
              role="combobox"
              aria-expanded={pickupSuggestions.length > 0}
              type="text"
              value={pickupQuery || pickup.address}
              onChange={(e) => {
                setPickupQuery(e.target.value);
                setPickup(prev => ({ ...prev, lat: null, lng: null }));
              }}
              onKeyDown={onPickupKeyDown}
              placeholder="Type address or open map"
            />
            <div className="actions">
              {/* clear button: only visible when there's text (controlled by CSS) */}
              <button
                type="button"
                className="clear-btn"
                aria-label="Clear pickup"
                onClick={() => {
                  setPickup({ address: "", lat: null, lng: null });
                  setPickupQuery("");
                  setPickupSuggestions([]);
                  setPickupActive(-1);
                }}
                title="Clear"
              >×</button>

              <button type="button" className="map-btn" onClick={() => openMap("pickup")} title="Open map">📍</button>
              <button type="button" className="loc-btn" onClick={() => {
                if (!navigator.geolocation) return alert("Geolocation not supported");
                navigator.geolocation.getCurrentPosition((p) => {
                  const lat = p.coords.latitude, lng = p.coords.longitude;
                  const addr = `My Location (${lat.toFixed(4)}, ${lng.toFixed(4)})`;
                  setPickup({ address: addr, lat, lng });
                  setPickupQuery(addr);
                }, () => alert("Unable to fetch location"));
              }} title="Use my location">📡</button>
            </div>
          </div>

          {pickupSuggestions && pickupSuggestions.length > 0 && (
            <ul className="inline-suggestions stylish-dropdown" role="listbox" aria-label="Pickup suggestions">
              {pickupSuggestions.map((r, i) => (
                <li
                  key={r.place_id}
                  role="option"
                  aria-selected={i === pickupActive}
                  className={i === pickupActive ? "active" : ""}
                  onMouseEnter={() => setPickupActive(i)}
                  onMouseLeave={() => setPickupActive(-1)}
                  onMouseDown={(ev) => { ev.preventDefault(); onSuggestionSelect('pickup', r); }}
                >
                  <div className="s-title">{r.display_name.split(',').slice(0,2).join(', ')}</div>
                  <div className="s-sub muted">{r.type} · {r.display_name.split(',').slice(-2).join(', ')}</div>
                </li>
              ))}
            </ul>
          )}
        </div>

          {/* Drop with inline search */}
        <div className="field full" style={{ position: "relative" }}>
          <label>Drop Location</label>
          <div className="input-with-actions">
            <input
              aria-label="Drop address"
              aria-autocomplete="list"
              role="combobox"
              aria-expanded={dropSuggestions.length > 0}
              type="text"
              value={dropQuery || drop.address}
              onChange={(e) => {
                setDropQuery(e.target.value);
                setDrop(prev => ({ ...prev, lat: null, lng: null }));
              }}
              onKeyDown={onDropKeyDown}
              placeholder="Type address or open map"
            />
            <div className="actions">
              <button
                type="button"
                className="clear-btn"
                aria-label="Clear drop"
                onClick={() => {
                  setDrop({ address: "", lat: null, lng: null });
                  setDropQuery("");
                  setDropSuggestions([]);
                  setDropActive(-1);
                }}
                title="Clear"
              >×</button>

              <button type="button" className="map-btn" onClick={() => openMap("drop")} title="Open map">📍</button>
              <button type="button" className="loc-btn" onClick={() => {
                if (!navigator.geolocation) return alert("Geolocation not supported");
                navigator.geolocation.getCurrentPosition((p) => {
                  const lat = p.coords.latitude, lng = p.coords.longitude;
                  const addr = `My Location (${lat.toFixed(4)}, ${lng.toFixed(4)})`;
                  setDrop({ address: addr, lat, lng });
                  setDropQuery(addr);
                }, () => alert("Unable to fetch location"));
              }} title="Use my location">📡</button>
            </div>
          </div>

          {dropSuggestions && dropSuggestions.length > 0 && (
            <ul className="inline-suggestions stylish-dropdown" role="listbox" aria-label="Drop suggestions">
              {dropSuggestions.map((r, i) => (
                <li
                  key={r.place_id}
                  role="option"
                  aria-selected={i === dropActive}
                  className={i === dropActive ? "active" : ""}
                  onMouseEnter={() => setDropActive(i)}
                  onMouseLeave={() => setDropActive(-1)}
                  onMouseDown={(ev) => { ev.preventDefault(); onSuggestionSelect('drop', r); }}
                >
                  <div className="s-title">{r.display_name.split(',').slice(0,2).join(', ')}</div>
                  <div className="s-sub muted">{r.type} · {r.display_name.split(',').slice(-2).join(', ')}</div>
                </li>
              ))}
            </ul>
          )}
        </div>

        </div>

        <div className="row">
          <div className="field">
            <label>Pick-up Date & Time</label>
            <input type="datetime-local" value={pickupDateTime} onChange={(e) => setPickupDateTime(e.target.value)} />
            <div className="hint">Choose when you want the driver to arrive.</div>
          </div>

          <div className="field actions-right">
            <label>&nbsp;</label>
            <Button label={loading ? "Sending..." : "Book Now"} type="submit" />
          </div>
        </div>
      </motion.form>

      {/* Map modal (optional) */}
      <AnimatePresence>
        {modalFor && (
          <motion.div className="map-modal" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <motion.div className="map-modal-inner" initial={{ y: 80 }} animate={{ y: 0 }} exit={{ y: 80 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                <h4 style={{ margin: 0 }}>{modalFor === "pickup" ? "Select Pick-up Location" : "Select Drop Location"}</h4>
                <button className="btn ghost" onClick={() => closeMap()}>✕</button>
              </div>

              <MapPicker initialPos={[11.0, 78.0]} onSelect={(payload) => onMapSelect(modalFor, payload)} closeModal={closeMap} />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Stylish dropdown CSS (paste into hero.scss if you prefer) */}
      <style jsx="true">{`
        .stylish-dropdown {
          position: absolute;
          left: 0;
          right: 0;
          top: calc(100% + 8px);
          background: #fff;
          border-radius: 12px;
          box-shadow: 0 12px 30px rgba(2,6,23,0.12);
          overflow: hidden;
          z-index: 1600;
          max-height: 260px;
          overflow-y: auto;
          padding: 6px;
          border: 1px solid rgba(2,6,23,0.04);
          animation: popIn 160ms cubic-bezier(.2,.9,.3,1);
        }
        .stylish-dropdown li {
          padding: 10px 12px;
          cursor: pointer;
          display: block;
          transition: background 120ms, transform 120ms;
          border-radius: 8px;
          margin: 4px 0;
        }
        .stylish-dropdown li:hover,
        .stylish-dropdown li.active {
          background: linear-gradient(90deg, rgba(15,98,254,0.06), rgba(255,107,53,0.03));
          transform: translateY(-2px);
        }
        .stylish-dropdown .s-title { font-weight:600; font-size:14px; color:#0b1220; }
        .stylish-dropdown .s-sub { font-size:12px; color:#6b7280; margin-top:4px; }
        @keyframes popIn { from { opacity: 0; transform: translateY(-6px); } to { opacity:1; transform:translateY(0); } }
        /* scrollbar */
        .stylish-dropdown::-webkit-scrollbar { width:8px; }
        .stylish-dropdown::-webkit-scrollbar-thumb { background: rgba(2,6,23,0.08); border-radius:8px; }
      `}</style>
    </div>
  );
};


/* ---------------- Hero (carousel + booking) ---------------- */
const Hero = () => {
  const slides = [
    { id: 1, img: HeroImage1, title: "Family OLA Taxi Awaits!", subtitle: "Ride Anytime, Anywhere — Hassle-Free." },
    { id: 2, img: HeroImage2, title: "Safe. Clean. Reliable.", subtitle: "Airport pickups, hourly hires, and city rides." },
    { id: 3, img: HeroImage3, title: "Your Ride, Your Comfort.", subtitle: "Travel in style with premium vehicles at your service." },
    { id: 4, img: HeroImage4, title: "Quick and Easy Booking.", subtitle: "Reserve your ride in seconds — no hassle, no wait." },
  ];
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const t = setInterval(() => setIndex((i) => (i + 1) % slides.length), 5000);
    return () => clearInterval(t);
  }, [slides.length]);

  return (
    <section className="hero hero-carousel" id="hero">
      <div className="carousel" aria-hidden="true">
        <AnimatePresence initial={false}>
          {slides.map((s, i) => i === index ? (
            <motion.div key={s.id} className="carousel-slide" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 1 }} style={{ backgroundImage: `url(${s.img})`}} />
          ) : null)}
        </AnimatePresence>
      </div>

      <div className="carousel-overlay">
        <div className="wrapper overlay-panel">
          <div className="hero-content">
            <h1 className="weight800 font50">{slides[index].title}</h1>
            <h2 className="weight700 font24">{slides[index].subtitle}</h2>
            <p className="font12">From airport pickups to city commutes, our reliable taxi service is just a tap away.</p>
          </div>

          <div className="hero-booking-card">
            <BookingForm />
          </div>
        </div>
      </div>
    </section>
  );
};

export default Hero;
