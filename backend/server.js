require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const bookingsRouter = require('./routes/bookings');

const app = express();
app.use(express.json());
app.use(cors());

// Mount bookings router
app.use('/bookings', bookingsRouter);

// Connect to MongoDB
const MONGO = process.env.MONGODB_URI;
if (!MONGO) {
  console.error('Missing MONGODB_URI in environment');
  process.exit(1);
}
mongoose.connect(MONGO, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(()=> console.log('MongoDB connected'))
  .catch(e => console.error('Mongo err', e));

const port = process.env.PORT || 5000;
app.listen(port, () => console.log(`Server listening on ${port}`));
