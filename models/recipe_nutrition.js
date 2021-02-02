const mongoose = require('mongoose');
const {v4: uuid} = require('uuid');

const recipeVitaminSchema = new mongoose.Schema({
  name: String,
  value: String
});

const recipeNutritionSchema = new mongoose.Schema({
  nutrition_id: {
    type: String,
    default: () => uuid(),
    required: true,
    unique: true
  },
  calories: {
    type: Number,
    required: false,
  },
  total_fat: {
    type: String,
    required: false,
  },
  trans_fat: {
    type: String,
    required: false
  },
  saturated_fat: {
    type: String,
    required: false
  },
  cholesterol: {
    type: String,
    required: false
  },
  sodium: {
    type: String,
    required: false
  },
  total_carbohydrates: {
    type: String,
    required: false
  },
  fiber: {
    type: String,
    required: false
  },
  sugar: {
    type: String,
    required: false
  },
  protein: {
    type: String,
    required: false
  },
  vitamins: {
    type: [recipeVitaminSchema],
    required: false,
    default: [],
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

module.exports = mongoose.model('recipenutritions', recipeNutritionSchema);
