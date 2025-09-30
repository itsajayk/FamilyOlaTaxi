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
mongoose.connect(MONGO, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(()=> console.log('MongoDB connected'))
  .catch(e => console.error('Mongo err', e));

const sendTelegramMessage = async (text) => {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  const chat = process.env.TELEGRAM_CHAT_ID;
  if (!token || !chat) throw new Error('Telegram config missing');
  const url = `https://api.telegram.org/bot${token}/sendMessage`;
  return axios.post(url, { chat_id: chat, text, parse_mode: 'HTML' });
};

app.post('/api/bookings', async (req, res) => {
  try {
    const payload = req.body;
    // basic validation
    if (!payload.pickupLocation || !payload.dropLocation || !payload.pickupDateTime) {
      return res.status(400).json({ message: 'Missing required fields' });
    }

    const booking = new Booking({
      tripType: payload.tripType || 'One-way',
      cabType: payload.cabType || 'Sedan',
      pickupLocation: payload.pickupLocation,
      dropLocation: payload.dropLocation,
      pickupDateTime: new Date(payload.pickupDateTime),
      createdAt: new Date()
    });

    const saved = await booking.save();

    // prepare Telegram message
    const msg = `<b>New Booking</b>\n\nTrip: ${booking.tripType}\nCab: ${booking.cabType}\nPickup: ${booking.pickupLocation.address}\nDrop: ${booking.dropLocation.address}\nPickup at: ${booking.pickupDateTime.toLocaleString()}\nID: ${saved._id}`;

    try {
      await sendTelegramMessage(msg);
    } catch (tgErr) {
      console.error('Telegram send failed', tgErr?.response?.data || tgErr.message);
      // do not fail the booking if telegram fails — still respond saved.
    }

    res.json(saved);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: err.message });
  }
});

const port = process.env.PORT || 5000;
app.listen(port, ()=> console.log('Server listening on', port));
