const mongoose = require('mongoose');
const {v4: uuid} = require('uuid');

const mediaSchema = new mongoose.Schema({
  medium_id: {
    type: String,
    default: uuid(),
    required: true,
    unique: true
  },
  priority: {
    type: Number,
    required: false,
  },
  url: {
    type: String,
    required: true,
  },
  type: {
    type: String,
    required: true
  },
  created_by: {
    type: String,
    required: true,
    // ! Validate it is a UUID
  },
  updated_by: {
    type: String,
    required: true,
    // ! Validate it is a UUID
  }
}, {
  timestamps: {
    createdAt: 'created_at',
    updatedAt: 'updated_at'
  }
});

const Media = mongoose.model('media', mediaSchema);
module.exports = Media;