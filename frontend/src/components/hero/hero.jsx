import React, { useEffect, useState } from "react";
import { Row, Col } from 'react-flexbox-grid';
import { motion, AnimatePresence } from 'framer-motion';
// Keep existing SCSS import (we'll inject small carousel-specific styles below to avoid needing a separate file)
import "./hero.scss";
// Assets (add additional images here if you want)
import HeroImage1 from '../../assets/hero/taxi.jpg';
import HeroImage2 from '../../assets/hero/taxi-car.jpeg';
import HeroImage3 from '../../assets/hero/car-taxi-2.jpg';
import HeroImage4 from '../../assets/hero/car-hero.jpg';
import Button from '../ui-components/button/button';

// --- BookingForm (kept self-contained from your original file) ---
const BookingForm = ({ className = '' }) => {
  const [tripType, setTripType] = useState('One-way');
  const [cabType, setCabType] = useState('Sedan');
  const [pickup, setPickup] = useState({ address: '', lat: null, lng: null });
  const [drop, setDrop] = useState({ address: '', lat: null, lng: null });
  const [pickupDateTime, setPickupDateTime] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPickupMap, setShowPickupMap] = useState(false);
  const [showDropMap, setShowDropMap] = useState(false);

  const validate = () => {
    if (!pickup.address || !drop.address || !pickupDateTime) {
      alert('Please fill pickup, drop and pickup date/time');
      return false;
    }
    return true;
  }

  const getMyLocation = async (setter) => {
    if (!navigator.geolocation) {
      alert('Geolocation not supported by your browser');
      return;
    }
    navigator.geolocation.getCurrentPosition((pos) => {
      const lat = pos.coords.latitude;
      const lng = pos.coords.longitude;
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

// --- Hero with background carousel and overlay booking form ---
const Hero = () => {
  const slides = [
    { id: 1, img: HeroImage1, title: 'Family OLA Taxi Awaits!', subtitle: 'Ride Anytime, Anywhere — Hassle-Free.' },
    { id: 2, img: HeroImage2, title: 'Safe. Clean. Reliable.', subtitle: 'Airport pickups, hourly hires, and city rides.' },
    { id: 3, img: HeroImage3, title: 'Your Ride, Your Comfort.', subtitle: 'Travel in style with premium vehicles at your service.' },
    { id: 4, img: HeroImage4, title: 'Quick and Easy Booking.', subtitle: 'Reserve your ride in seconds — no hassle, no wait.' }

  ];

  const [index, setIndex] = useState(0);
  const delay = 5000; // 5s per slide

  useEffect(() => {
    const t = setInterval(() => setIndex(i => (i + 1) % slides.length), delay);
    return () => clearInterval(t);
  }, [slides.length]);

  return (
    <div className="hero hero-carousel" id="hero">

      {/* Carousel slides (behind everything) */}
      <div className="carousel" aria-hidden="true">
        <AnimatePresence initial={false}>
          {slides.map((s, i) => (
            i === index ? (
              <motion.div
                key={s.id}
                className="carousel-slide"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 1 }}
                style={{ backgroundImage: `url(${s.img})` }}
              />
            ) : null
          ))}
        </AnimatePresence>
      </div>

      {/* Content overlay (on top of carousel) */}
      <div className="carousel-overlay">
        <div className="wrapper overlay-panel">
          <div className="hero-content">
            <h1 className="weight800 font50">{slides[index].title}</h1>
            <h2 className="weight700 font24">{slides[index].subtitle}</h2>
            <p className="font12">From airport pickups to city commutes, our reliable taxi service is just a tap away. Clean cars. Friendly drivers. Transparent pricing.</p>
          </div>

          <div className="hero-booking-card">
            <BookingForm />
          </div>
        </div>
      </div>

    </div>
  )
}

export default Hero;
