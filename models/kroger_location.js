const mongoose = require('mongoose');

const krogerLocationSchema = new mongoose.Schema({
  location_id: {
    type: String,
    required: true,
    unique: true
  },
  latLng: {
    type: { type: String },
    coordinates: [],
  },
  name: {
    type: String,
    required: false,
  },
  address: {
    type: String,
    required: true
  },
  address2: {
    type: String,
    required: false
  },
  city: {
    type: String,
    required: true
  },
  state: {
    type: String,
    required: true
  },
  county: {
    type: String,
    required: false
  },
  zipCode: {
    type: String,
    required: true
  }
});

krogerLocationSchema.index({ "latLng": "2dsphere" });

module.exports = mongoose.model('krogerlocations', krogerLocationSchema);
