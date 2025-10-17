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
    // CHANGED: ensure container still exists when timeout fires
    if (!containerRef.current) return;

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
      try { if (mapRef.current) mapRef.current.invalidateSize(); } catch (e) {}
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
      if (mapRef.current) {
        mapRef.current.off("click", onMapClick);
        try { mapRef.current.remove(); } catch (e) {}
        mapRef.current = null;
      }
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


const BookingForm = ({ className = "" }) => {
  const [tripType, setTripType] = useState("One-way");
  const [cabType, setCabType] = useState("Sedan");
  const [pickup, setPickup] = useState({ address: "", lat: null, lng: null });
  const [drop, setDrop] = useState({ address: "", lat: null, lng: null });
  const [pickupDateTime, setPickupDateTime] = useState("");
  const [loading, setLoading] = useState(false);
  const [modalFor, setModalFor] = useState(null);
    // CHANGED: success modal + timeout ref
  const [successModal, setSuccessModal] = useState({ open: false, ref: null });
  const successTimeoutRef = useRef(null);


  // ADDED: Local package + list
  const [localPackage, setLocalPackage] = useState("");
  const LOCAL_PACKAGES = [
    "Navagraha temple",
    "108 Divya Desam Temples",
    "Mayiladuthurai – Chidambaram",
    "Mayiladuthurai – Kumbakonam",
    "Mayiladuthurai – Thanjavur",
    "Mayiladuthurai - Thiruvarur"
  ];

  // inline search state + keyboard nav indexes
  const [pickupQuery, setPickupQuery] = useState("");
  const [dropQuery, setDropQuery] = useState("");
  const [pickupSuggestions, setPickupSuggestions] = useState([]);
  const [dropSuggestions, setDropSuggestions] = useState([]);
  const [pickupActive, setPickupActive] = useState(-1);
  const [dropActive, setDropActive] = useState(-1);

  // ADDED: refs to input fields to blur after selection
  const pickupInputRef = useRef(null); // ADDED
  const dropInputRef = useRef(null);   // ADDED

  const searchTimerRef = useRef(null);
  const API_BASE = "https://familyolataxi.onrender.com";

  // debounced search helper (same as before)
  const searchNominatim = (q, setResults) => {
    clearTimeout(searchTimerRef.current);
    if (!q) {
      setResults([]);
      return;
    }
    searchTimerRef.current = setTimeout(async () => {
      try {
        let results = await photonSearch(q, TN_BBOX, 6);
        if (results && results.length) return setResults(results);

        results = await nominatimSearchTN(q, 6);
        if (results && results.length) return setResults(results);

        results = await photonSearch(q, null, 6);
        setResults(results || []);
      } catch (err) {
        console.error("search", err);
        setResults([]);
      }
    }, 300);
  };

    useEffect(() => {
    return () => {
      clearTimeout(searchTimerRef.current);
      clearTimeout(successTimeoutRef.current);
    };
  }, []);

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
    // CHANGED: ensure pending search timer cancelled and dropdown closed immediately
    clearTimeout(searchTimerRef.current);

    const lat = parseFloat(r.lat), lng = parseFloat(r.lon), addr = r.display_name;
    const payload = { address: addr, lat, lng };

    if (which === 'pickup') {
      setPickup(payload);
      setPickupQuery(addr);
      setPickupSuggestions([]);
      setPickupActive(-1);
      // blur input after event cycle so the dropdown hides immediately
      setTimeout(() => { if (pickupInputRef.current) pickupInputRef.current.blur(); }, 0);
    } else {
      setDrop(payload);
      setDropQuery(addr);
      setDropSuggestions([]);
      setDropActive(-1);
      setTimeout(() => { if (dropInputRef.current) dropInputRef.current.blur(); }, 0);
    }
  };


    const validate = () => {
    // Allow typed queries to count as filled addresses.
    if (tripType !== "Local Packages") {
      const pickupFilled = Boolean((pickup && pickup.address) || pickupQuery);
      const dropFilled = Boolean((drop && drop.address) || dropQuery);
      if (!pickupFilled || !dropFilled) {
        alert("Please fill pickup and drop locations (or choose Local Packages).");
        return false;
      }
    }
    if (!pickupDateTime) {
      alert("Please fill pickup date/time");
      return false;
    }
    if (tripType === "Local Packages" && !localPackage) {
      alert("Please select a Local Package.");
      return false;
    }
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;
    setLoading(true);

    // Normalize location object so backend always receives an address string
    // even if the user typed it (no lat/lng available).
    const normalizeLoc = (loc, query) => {
      if (!loc && !query) return null;
      if (loc && loc.address) return loc;
      // user typed an address (query) but didn't pick a suggestion/map
      if (query) return { address: query, lat: null, lng: null };
      return null;
    };

    const pickupLoc = normalizeLoc(pickup, pickupQuery);
    const dropLoc = normalizeLoc(drop, dropQuery);

    const payload = {
      tripType,
      cabType,
      pickupLocation: tripType === "Local Packages" ? (pickupLoc ? pickupLoc : null) : pickupLoc,
      dropLocation: tripType === "Local Packages" ? (dropLoc ? dropLoc : null) : dropLoc,
      pickupDateTime,
      createdAt: new Date().toISOString(),
      localPackage: tripType === "Local Packages" ? localPackage : null,
    };

    try {
      const res = await axios.post(`${API_BASE.replace(/\/$/, "")}/bookings`, payload);

      const refId = (res?.data?._id) || (res?.data?.id) || null;
      setSuccessModal({ open: true, ref: refId });

      clearTimeout(successTimeoutRef.current);
      successTimeoutRef.current = setTimeout(() => setSuccessModal({ open: false, ref: null }), 3500);

      // reset form
      setPickup({ address: "", lat: null, lng: null });
      setDrop({ address: "", lat: null, lng: null });
      setPickupQuery(""); setDropQuery(""); setPickupDateTime("");
      setLocalPackage("");
      setPickupSuggestions([]); setDropSuggestions([]);
    } catch (err) {
      console.error("Booking submit error:", err, err?.response?.data);
      alert("Failed to submit: " + (err?.response?.data?.message || err?.message || "unknown error"));
    } finally {
      setLoading(false);
    }
  };



  // keyboard nav handlers (unchanged)
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
              <option>One-way</option>
              <option>Round Trip</option>
              <option>Local Packages</option>
            </select>
          </div>

          <div className="field">
            <label>Cab Type</label>
            <select value={cabType} onChange={(e) => setCabType(e.target.value)}>
              <option>Sedan</option><option>SUV</option><option>Innova</option>
            </select>
          </div>
        </div>

        {/* ADDED: Local Packages select shown only when Trip Type is Local Packages */}
        {tripType === "Local Packages" && (
          <div className="row">
            <div className="field">
              <label>Select Local Package</label>
              <select value={localPackage} onChange={(e) => setLocalPackage(e.target.value)}>
                <option value="">-- Select package --</option>
                {LOCAL_PACKAGES.map((p, idx) => (<option value={p} key={idx}>{p}</option>))}
              </select>
              <div className="hint">Choose one of our local sightseeing packages.</div>
            </div>
          </div>
        )}

        <div className="row">
          {/* Pickup input hidden for Local Packages (CHANGED) */}
          {tripType !== "Local Packages" && (
            <div className="field full" style={{ position: "relative" }}>
              <label>Pick-up Location</label>
              <div className="input-with-actions" style={{ position: 'relative' }}>
                <input
                  id="pickup-input" // CHANGED
                  ref={pickupInputRef}
                  aria-label="Pickup address"
                  aria-autocomplete="list"
                  role="combobox"
                  aria-controls="pickup-listbox" // CHANGED
                  aria-expanded={pickupSuggestions.length > 0}
                  type="text"
                  value={pickupQuery || pickup.address}
                  onChange={(e) => {
                    setPickupQuery(e.target.value);
                    setPickup(prev => ({ ...prev, lat: null, lng: null }));
                  }}
                  onKeyDown={onPickupKeyDown}
                  placeholder="Type address or open map"
                  style={{ paddingRight: 110 }}
                />

                {(pickupQuery || pickup.address) && (
                  <button type="button" className="input-clear-btn" aria-label="Clear pickup"
                    onClick={() => { setPickup({ address: "", lat: null, lng: null }); setPickupQuery(""); setPickupSuggestions([]); setPickupActive(-1); }}>
                    ×
                  </button>
                )}
                <div className="actions" style={{ right: 10, position: 'absolute', top: '50%', transform: 'translateY(-50%)' }}>
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
                <ul id="pickup-listbox" className="inline-suggestions stylish-dropdown" role="listbox" aria-label="Pickup suggestions">
                  {pickupSuggestions.map((r, i) => (
                    <li key={r.place_id}
                        role="option"
                        aria-selected={i === pickupActive}
                        className={i === pickupActive ? "active" : ""}
                        onMouseEnter={() => setPickupActive(i)}
                        onMouseLeave={() => setPickupActive(-1)}
                        onClick={() => onSuggestionSelect('pickup', r)} // CHANGED: use onClick + handler blurs
                    >
                      <div className="s-title">{r.display_name.split(',').slice(0,2).join(', ')}</div>
                      <div className="s-sub muted">{r.type} · {r.display_name.split(',').slice(-2).join(', ')}</div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}

          {/* Drop input hidden for Local Packages (CHANGED) */}
          {tripType !== "Local Packages" && (
            <div className="field full" style={{ position: "relative" }}>
              <label>Drop Location</label>
              <div className="input-with-actions" style={{ position: 'relative' }}>
                <input
                  ref={dropInputRef} // ADDED
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
                  style={{ paddingRight: 110 }}
                />
                {(dropQuery || drop.address) && (
                  <button type="button" className="input-clear-btn" aria-label="Clear drop"
                    onClick={() => { setDrop({ address: "", lat: null, lng: null }); setDropQuery(""); setDropSuggestions([]); setDropActive(-1); }}>
                    ×
                  </button>
                )}
                <div className="actions" style={{ right: 10, position: 'absolute', top: '50%', transform: 'translateY(-50%)' }}>
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
                    <li key={r.place_id}
                        role="option"
                        aria-selected={i === dropActive}
                        className={i === dropActive ? "active" : ""}
                        onMouseEnter={() => setDropActive(i)}
                        onMouseLeave={() => setDropActive(-1)}
                        onClick={() => onSuggestionSelect('drop', r)} // CHANGED => onClick
                    >
                      <div className="s-title">{r.display_name.split(',').slice(0,2).join(', ')}</div>
                      <div className="s-sub muted">{r.type} · {r.display_name.split(',').slice(-2).join(', ')}</div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}
        </div>

        <div className="row">
          <div className="field">
            <label>Pick-up Date & Time</label>
            {/* CHANGED: blur to close native picker immediately after selection */}
            <input
              type="datetime-local"
              value={pickupDateTime}
              onChange={(e) => {
                setPickupDateTime(e.target.value);
                // close picker
                try { e.target.blur(); } catch (e) {}
              }}
            />
            <div className="hint">Choose when you want the driver to arrive.</div>
          </div>

          {/* CHANGED: use native button to ensure form submit works */}
            <div className="field actions-right">
              <label>&nbsp;</label>
              <button
                className="btn primary"
                type="submit"
                disabled={loading}
                aria-disabled={loading}
              >
                {/* CHANGED: inline spinner */}
                {loading && <span className="btn-spinner" aria-hidden="true"></span>}
                <span className="btn-text">{loading ? "Sending..." : "Book Now"}</span>
              </button>
            </div>
        </div>
      </motion.form>

            {/* CHANGED: small overlay spinner while loading */}
      {loading && (
        <div className="booking-loading-overlay" aria-hidden="true">
          <div className="overlay-spinner" />
        </div>
      )}

      {/* CHANGED: success modal */}
      <AnimatePresence>
        {successModal.open && (
          <motion.div className="success-modal" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 10 }}>
            <div className="success-modal-inner">
              <h4>Booking Submitted</h4>
              <p>Your booking was submitted successfully.</p>
              {successModal.ref ? <div className="muted">Ref: <strong>{successModal.ref}</strong></div> : null}
              <div style={{ marginTop: 10 }}>
                <button className="btn small" onClick={() => setSuccessModal({ open: false, ref: null })}>Close</button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>


      {/* Map modal (unchanged) */}
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
    </div>
  );
};



/* ---------------- Hero (carousel + booking) ---------------- */
const Hero = () => {
  const slides = [
    {
      id: 1,
      img: HeroImage1,
      title: "Family OLA taxi tours & Droptaxi",
      subtitle: "24/7 local & outstation rides — safe, punctual, affordable."
    },
    {
      id: 2,
      img: HeroImage2,
      title: "Trusted Drivers, Clean Cars",
      subtitle: "Experienced, family-friendly drivers for every journey."
    },
    {
      id: 3,
      img: HeroImage3,
      title: "Airport & Outstation Transfers",
      subtitle: "Timely airport pickups and comfortable long-distance trips."
    },
    {
      id: 4,
      img: HeroImage4,
      title: "Book Instantly",
      subtitle: "Call 95247 35812 or 95148 35812 — reserve online in seconds."
    },
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
