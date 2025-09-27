import React, { useState } from "react";
import { Row, Col } from "react-flexbox-grid";
// SCSS
import "./hero.scss";
//Assets
import HeroImage from '../../assets/hero/taxi.jpg';
//Components
import Button from '../ui-components/button/button';
import { motion } from 'framer-motion';

// Booking form component is embedded here so hero.jsx stays self-contained
const BookingForm = ({ className = '' }) => {
  const [tripType, setTripType] = useState('One-way');
  const [cabType, setCabType] = useState('Sedan');
  const [pickup, setPickup] = useState({ address: '', lat: null, lng: null });
  const [drop, setDrop] = useState({ address: '', lat: null, lng: null });
  const [pickupDateTime, setPickupDateTime] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPickupMap, setShowPickupMap] = useState(false);
  const [showDropMap, setShowDropMap] = useState(false);

  // Simple validation
  const validate = () => {
    if (!pickup.address || !drop.address || !pickupDateTime) {
      alert('Please fill pickup, drop and pickup date/time');
      return false;
    }
    return true;
  }

  // Placeholder "map" action: use browser geolocation for quick selection
  const getMyLocation = async (setter) => {
    if (!navigator.geolocation) {
      alert('Geolocation not supported by your browser');
      return;
    }
    navigator.geolocation.getCurrentPosition((pos) => {
      const lat = pos.coords.latitude;
      const lng = pos.coords.longitude;
      // We don't have reverse-geocoding here — store lat/lng and a simple address label
      setter({ address: `My Location (${lat.toFixed(4)}, ${lng.toFixed(4)})`, lat, lng });
    }, () => alert('Unable to fetch your location'));
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;
    setLoading(true);
    const payload = {
      tripType,
      cabType,
      pickupLocation: { ...pickup },
      dropLocation: { ...drop },
      pickupDateTime: new Date(pickupDateTime),
      createdAt: new Date()
    };

    try {
      const res = await fetch('/api/bookings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      if (!res.ok) throw new Error('Failed to save booking');
      const data = await res.json();
      alert('Booking submitted! Reference: ' + (data._id || 'n/a'));
      // reset small parts
      setPickup({ address: '', lat: null, lng: null });
      setDrop({ address: '', lat: null, lng: null });
      setPickupDateTime('');
    } catch (err) {
      console.error(err);
      alert('Error submitting booking: ' + err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <motion.form
      className={`booking-form ${className}`}
      onSubmit={handleSubmit}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35 }}
    >
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
            <option>Sedan</option>
            <option>SUV</option>
            <option>Innova</option>
          </select>
        </div>
      </div>

      <div className="row">
        <div className="field full">
          <label>Pick-up Location</label>
          <div className="input-with-actions">
            <input
              type="text"
              value={pickup.address}
              onChange={(e) => setPickup(prev => ({ ...prev, address: e.target.value }))}
              placeholder="Click map icon or type an address"
            />
            <div className="actions">
              <button type="button" className="map-btn" onClick={() => setShowPickupMap(true)} title="Open map">📍</button>
              <button type="button" className="loc-btn" onClick={() => getMyLocation(setPickup)} title="Use my location">📡</button>
            </div>
          </div>
        </div>

        <div className="field full">
          <label>Drop Location</label>
          <div className="input-with-actions">
            <input
              type="text"
              value={drop.address}
              onChange={(e) => setDrop(prev => ({ ...prev, address: e.target.value }))}
              placeholder="Click map icon or type an address"
            />
            <div className="actions">
              <button type="button" className="map-btn" onClick={() => setShowDropMap(true)} title="Open map">📍</button>
              <button type="button" className="loc-btn" onClick={() => getMyLocation(setDrop)} title="Use my location">📡</button>
            </div>
          </div>
        </div>
      </div>

      <div className="row">
        <div className="field">
          <label>Pick-up Date & Time</label>
          <input
            type="datetime-local"
            value={pickupDateTime}
            onChange={(e) => setPickupDateTime(e.target.value)}
          />
        </div>

        <div className="field actions-right">
          <label>&nbsp;</label>
          <Button label={loading ? 'Submitting...' : 'Book Now'} type="submit" />
        </div>
      </div>

      {/* Simple map modal placeholders. Replace with real Map/Leaflet/GoogleMap later */}
      {showPickupMap && (
        <div className="map-modal">
          <div className="map-modal-inner">
            <h4>Select Pick-up Location</h4>
            <p>This modal is a lightweight placeholder. Use the browser geolocation or type an address.</p>
            <div className="modal-actions">
              <button onClick={() => { getMyLocation(setPickup); setShowPickupMap(false); }}>Use My Location</button>
              <button onClick={() => setShowPickupMap(false)}>Close</button>
            </div>
          </div>
        </div>
      )}

      {showDropMap && (
        <div className="map-modal">
          <div className="map-modal-inner">
            <h4>Select Drop Location</h4>
            <p>This modal is a lightweight placeholder. Use the browser geolocation or type an address.</p>
            <div className="modal-actions">
              <button onClick={() => { getMyLocation(setDrop); setShowDropMap(false); }}>Use My Location</button>
              <button onClick={() => setShowDropMap(false)}>Close</button>
            </div>
          </div>
        </div>
      )}
    </motion.form>
  )
}

const Hero = () => (
  <div className="hero" id="hero">
    <div className="wrapper">
      <Row>
        <Col md={12} lg={6}>
          <div className="hero-info">
            <h1 className="weight800 font50">Family OLA Taxi Awaits!</h1>
            <h1 className="weight800 font40">Ride Anytime, Anywhere — Hassle-Free.</h1>
            <p className="font12">From airport pickups to city commutes, our reliable taxi service is just a tap away. Clean cars. Friendly drivers. Transparent pricing.</p>

            {/* Booking form injected into hero-info. It is responsive and keeps existing CTA button below for backward compatibility */}
            <BookingForm className="hero-booking" />

            {/* <div className="hero-cta">
              <Button label="SEND MESSAGE" target={"contact"} />
            </div> */}
          </div>
        </Col>

        <Col md={12} lg={6}>
          <div className="hero-image">
            <img src={HeroImage} alt="hero" />
          </div>
        </Col>
      </Row>
    </div>
  </div>
);

export default Hero;
