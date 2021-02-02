const mongoose = require('mongoose');
const {v4: uuid} = require('uuid');

const recipeIngredientSchema = new mongoose.Schema({
  ingredient_id: {
    type: String,
    default: uuid(),
    required: true,
    unique: true
  },
  name: {
    type: String,
    required: false,
  },
  type: {
    type: String,
    required: false,
  },
  min_quantity: {
    type: Number,
    required: false
  },
  max_quantity: {
    type: Number,
    required: false
  },
  unit: {
    type: String,
    required: false
  },
  raw: {
    type: String, 
    required: true
  },
  rating: {
    type: Number,
    required: false,
  },
  media: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'media'
    }
  ],
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

const RecipeIngredient = mongoose.model('recipeingredients', recipeIngredientSchema);
module.exports = RecipeIngredient;