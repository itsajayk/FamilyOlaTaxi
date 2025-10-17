const express = require('express');
const router = express.Router();
const Booking = require('../models/Booking');
const axios = require('axios');

// Helper
function escapeHtml(str = '') {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

// Telegram helpers
const sendTelegramMessage = async (text) => {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  const chat = process.env.TELEGRAM_CHAT_ID;
  if (!token || !chat) return;
  const url = `https://api.telegram.org/bot${token}/sendMessage`;
  return axios.post(url, { chat_id: chat, text, parse_mode: 'HTML', disable_web_page_preview: true }, { timeout: 8000 });
};

const sendTelegramLocation = async (lat, lon) => {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  const chat = process.env.TELEGRAM_CHAT_ID;
  if (!token || !chat) return;
  const url = `https://api.telegram.org/bot${token}/sendLocation`;
  return axios.post(url, { chat_id: chat, latitude: lat, longitude: lon }, { timeout: 8000 });
};

// POST /bookings
router.post('/', async (req, res) => {
  try {
    const payload = req.body;

    if (payload.tripType !== "Local Packages") {
      if (!payload.pickupLocation || !payload.dropLocation || !payload.pickupDateTime) {
        return res.status(400).json({ message: 'Missing required fields: pickupLocation, dropLocation, pickupDateTime' });
      }
    } else {
      if (!payload.pickupDateTime || !payload.localPackage) {
        return res.status(400).json({ message: 'Local Packages require pickupDateTime and localPackage selection' });
      }
    }

    const pu = payload.pickupLocation || null;
    const dr = payload.dropLocation || null;

    const booking = new Booking({
      tripType: payload.tripType || 'One-way',
      cabType: payload.cabType || 'Sedan',
      localPackage: payload.localPackage || null,
      pickupLocation: pu,
      dropLocation: dr,
      customerName: payload.customerName || '',
      customerPhone: payload.customerPhone || '',
      customerEmail: payload.customerEmail || '',
      pickupDateTime: new Date(payload.pickupDateTime),
      createdAt: new Date()
    });

    const saved = await booking.save();

    // Telegram message
    const lines = [];
    lines.push('<b>New Booking Received</b>');
    lines.push(`<b>ID:</b> ${escapeHtml(saved._id.toString())}`);
    lines.push(`<b>Trip:</b> ${escapeHtml(saved.tripType || '')}`);
    lines.push(`<b>Cab:</b> ${escapeHtml(saved.cabType || '')}`);
    if (saved.localPackage) lines.push(`<b>Package:</b> ${escapeHtml(saved.localPackage)}`);
    if (saved.customerName) lines.push(`<b>Name:</b> ${escapeHtml(saved.customerName)}`);
    if (saved.customerPhone) lines.push(`<b>Phone:</b> ${escapeHtml(saved.customerPhone)}`);

    const puAddr = saved.pickupLocation?.address || '';
    const puLat = saved.pickupLocation?.lat ?? null;
    const puLon = saved.pickupLocation?.lng ?? null;
    const drAddr = saved.dropLocation?.address || '';
    const drLat = saved.dropLocation?.lat ?? null;
    const drLon = saved.dropLocation?.lng ?? null;

    lines.push(`<b>Pickup:</b> ${escapeHtml(puAddr)}`);
    if (puLat != null && puLon != null) {
      lines.push(`<a href="https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(puLat + ',' + puLon)}">View Pickup on Map</a>`);
    }
    lines.push(`<b>Drop:</b> ${escapeHtml(drAddr)}`);
    if (drLat != null && drLon != null) {
      lines.push(`<a href="https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(drLat + ',' + drLon)}">View Drop on Map</a>`);
    }
    lines.push(`<b>Pickup at:</b> ${escapeHtml(saved.pickupDateTime ? saved.pickupDateTime.toLocaleString() : '')}`);
    lines.push(`<b>Created:</b> ${escapeHtml(saved.createdAt.toLocaleString())}`);

    const messageText = lines.join('\n');

    try { await sendTelegramMessage(messageText); } catch(e){ console.warn(e); }
    try { 
      if (puLat != null && puLon != null) await sendTelegramLocation(puLat, puLon);
      if (drLat != null && drLon != null) await sendTelegramLocation(drLat, drLon);
    } catch(e){ console.warn(e); }

    res.status(201).json(saved);

  } catch (err) {
    console.error('Booking save error:', err);
    res.status(500).json({ message: err.message || 'Internal server error' });
  }
});

module.exports = router;
