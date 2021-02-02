const mongoose = require('mongoose');
const {v4: uuid} = require('uuid');

const mealSchema = new mongoose.Schema({
  meal_id: {
    type: String,
    default: () => uuid(),
    required: true,
    unique: true
  },
  user_id: {
    type: String,
    required: true,
  },
  date: {
    type: Date,
    required: false,
  },
  tags: {
    type: Array,
    required: false,
  },
  name: {
    type: String,
    required: false
  },
  total_calories: {
    type: Number,
    required: false
  },
  total_time: {
    type: Number,
    required: false
  },
  total_time_units: {
    type: String,
    required: false,
  },
  recipes: [{
    type: mongoose.Schema.ObjectId,
    ref: 'recipes',
    required: false,
  }],
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

module.exports = mongoose.model('meals', mealSchema);