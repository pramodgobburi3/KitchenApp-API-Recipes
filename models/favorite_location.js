const mongoose = require('mongoose');
const {v4: uuid} = require('uuid');

const favoriteLocationSchema = new mongoose.Schema({
  favorite_id: {
    type: String,
    default: () => uuid(),
    required: true,
    unique: true
  },
  name: {
    type: String,
    required: true
  },
  user_id: {
    type: String,
    required: true
  },
  locationId: {
    type: String,
    required: true
  }
}, {
  timestamps: {
    createdAt: 'created_at',
    updatedAt: 'updated_at'
  }
});

module.exports = mongoose.model('favoritelocations', favoriteLocationSchema);
