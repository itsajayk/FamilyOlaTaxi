const mongoose = require('mongoose');

const BookingSchema = new mongoose.Schema({
  tripType: String,
  cabType: String,
  pickupLocation: {
    address: String, lat: Number, lng: Number
  },
  dropLocation: {
    address: String, lat: Number, lng: Number
  },
  pickupDateTime: Date,
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Booking', BookingSchema);
