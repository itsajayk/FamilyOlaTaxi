const mongoose = require('mongoose');

const BookingSchema = new mongoose.Schema({
  tripType: String,
  cabType: String,
  localPackage: { type: String, default: null },
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
  customerName: { type: String, default: "" },
  customerPhone: { type: String, default: "" },
  customerEmail: { type: String, default: "" },
  pickupDateTime: Date,
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Booking', BookingSchema);
