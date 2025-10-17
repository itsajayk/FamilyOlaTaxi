// models/Booking.js
const mongoose = require('mongoose');

const BookingSchema = new mongoose.Schema({
  tripType: String,
  cabType: String,
  localPackage: { type: String, default: null }, // ADDED
  pickupLocation: {
    address: String,
    lat: Number,
    lng: Number
  },
  dropLocation: {
    address: String,
    lat: Number,
    lng: Number
  },
  // optional contact fields (useful for admin)
  customerName: { type: String, default: "" }, // ADDED (optional)
  customerPhone: { type: String, default: "" }, // ADDED (optional)
  customerEmail: { type: String, default: "" }, // ADDED (optional)

  pickupDateTime: Date,
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Booking', BookingSchema);
