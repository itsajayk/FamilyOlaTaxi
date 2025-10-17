// server.js
require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const axios = require('axios');
const cors = require('cors');

const Booking = require('./models/Booking');

const app = express();
app.use(express.json());
app.use(cors());

const MONGO = process.env.MONGODB_URI;
if (!MONGO) {
  console.error('Missing MONGODB_URI in environment');
  process.exit(1);
}
mongoose.connect(MONGO, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(()=> console.log('MongoDB connected'))
  .catch(e => console.error('Mongo err', e));

/**
 * Helper - minimal HTML escape for Telegram parse_mode=HTML
 */
function escapeHtml(str = '') {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

/**
 * Send a Telegram message (text).
 * Reads TELEGRAM_BOT_TOKEN and TELEGRAM_CHAT_ID from env.
 */
const sendTelegramMessage = async (text) => {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  const chat = process.env.TELEGRAM_CHAT_ID;
  if (!token || !chat) {
    throw new Error('Telegram config missing (TELEGRAM_BOT_TOKEN or TELEGRAM_CHAT_ID)');
  }
  const url = `https://api.telegram.org/bot${token}/sendMessage`;
  return axios.post(url, {
    chat_id: chat,
    text,
    parse_mode: 'HTML',
    disable_web_page_preview: true
  }, { timeout: 8000 });
};

/**
 * Optionally send location to Telegram (works if bot is allowed to send to the target chat).
 * This is best-effort: failures won't break the booking save.
 */
const sendTelegramLocation = async (lat, lon) => {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  const chat = process.env.TELEGRAM_CHAT_ID;
  if (!token || !chat) return;
  const url = `https://api.telegram.org/bot${token}/sendLocation`;
  return axios.post(url, {
    chat_id: chat,
    latitude: lat,
    longitude: lon
  }, { timeout: 8000 });
};

app.post('/api/bookings', async (req, res) => {
  try {
    const payload = req.body;

    // CHANGED: validation that allows Local Packages without pickup/drop
    if (payload.tripType !== "Local Packages") {
      if (!payload.pickupLocation || !payload.dropLocation || !payload.pickupDateTime) {
        return res.status(400).json({ message: 'Missing required fields: pickupLocation, dropLocation, pickupDateTime' });
      }
    } else {
      // Local Packages still require pickupDateTime and selected package
      if (!payload.pickupDateTime || !payload.localPackage) {
        return res.status(400).json({ message: 'Local Packages require pickupDateTime and localPackage selection' });
      }
    }

    // COERCE missing locations to null (defensive)
    const pu = payload.pickupLocation || null;
    const dr = payload.dropLocation || null;

    // create booking document (include optional fields)
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

    // Build Telegram message safely (escapeHtml assumed defined elsewhere)
    const lines = [];
    lines.push('<b>New Booking Received</b>');
    lines.push('');
    lines.push(`<b>ID:</b> ${escapeHtml(saved._id.toString())}`);
    lines.push(`<b>Trip:</b> ${escapeHtml(saved.tripType || '')}`);
    lines.push(`<b>Cab:</b> ${escapeHtml(saved.cabType || '')}`);
    if (saved.localPackage) lines.push(`<b>Package:</b> ${escapeHtml(saved.localPackage)}`);
    if (saved.customerName) lines.push(`<b>Name:</b> ${escapeHtml(saved.customerName)}`);
    if (saved.customerPhone) lines.push(`<b>Phone:</b> ${escapeHtml(saved.customerPhone)}`);

    lines.push('');
    // pickup (may be null)
    const puAddr = saved.pickupLocation?.address || '';
    const puLat = saved.pickupLocation?.lat ?? null;
    const puLon = saved.pickupLocation?.lng ?? null;
    lines.push(`<b>Pickup:</b> ${escapeHtml(puAddr)}`);
    if (puLat != null && puLon != null) {
      lines.push(`<a href="https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(puLat + ',' + puLon)}">View Pickup on Map</a>`);
    }

    // drop (may be null)
    const drAddr = saved.dropLocation?.address || '';
    const drLat = saved.dropLocation?.lat ?? null;
    const drLon = saved.dropLocation?.lng ?? null;
    lines.push(`<b>Drop:</b> ${escapeHtml(drAddr)}`);
    if (drLat != null && drLon != null) {
      lines.push(`<a href="https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(drLat + ',' + drLon)}">View Drop on Map</a>`);
    }

    lines.push('');
    lines.push(`<b>Pickup at:</b> ${escapeHtml(saved.pickupDateTime ? saved.pickupDateTime.toLocaleString() : '')}`);
    lines.push(`<b>Created:</b> ${escapeHtml(saved.createdAt.toLocaleString())}`);

    const messageText = lines.join('\n');

    // send text message (best-effort)
    try {
      await sendTelegramMessage(messageText);
    } catch (tgErr) {
      console.error('Telegram send failed (message):', tgErr?.response?.data || tgErr.message || tgErr);
      // continue — do not fail the request if Telegram fails
    }

    // optionally send locations to chat (one or both) - best-effort
    try {
      if (puLat != null && puLon != null) {
        await sendTelegramLocation(puLat, puLon);
      }
      if (drLat != null && drLon != null) {
        await sendTelegramLocation(drLat, drLon);
      }
    } catch (locErr) {
      console.warn('Telegram sendLocation failed:', locErr?.response?.data || locErr.message || locErr);
    }

    res.json(saved);
  } catch (err) {
    console.error('Booking save error:', err);
    res.status(500).json({ message: err.message || 'Internal server error' });
  }
});


const port = process.env.PORT || 5000;
app.listen(port, ()=> console.log('Server listening on', port));
