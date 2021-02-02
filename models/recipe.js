const mongoose = require('mongoose');
const {v4: uuid} = require('uuid');

const recipeSchema = new mongoose.Schema({
  recipe_id: {
    type: String,
    default: () => uuid(),
    required: true,
    unique: true
  },
  cuisine: {
    type: String,
    required: false
  },
  name: {
    type: String,
    required: true,
  },
  description: {
    type: String,
    required: false,
    default: "",
  },
  prep_time: {
    type: String,
    required: false,
  },
  cook_time: {
    type: String,
    required: false
  },
  difficulty: {
    type: Number,
    required: false,
  },
  rating: {
    type: Number,
    required: false,
  },
  special_requirements: {
    type: String,
    required: false,
  },
  author: {
    type: String,
    required: false,
  },
  accessibility: {
    type: String,
    required: true,
    enum: ['PUBLIC', 'PRIVATE']
  },
  type: {
    type: String,
    required: true,
    // Need to validate (ENUM)
  },
  source: {
    type: String,
    required: false
  },
  serving_size: {
    type: Number,
    required: false
  },
  allergies: {
    type: Array,
    required: false,
    // ? Need to validate (ENUMS) - Strings
  },
  nutrition: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'recipenutritions',
    required: false,
  },
  tags: {
    type: Array,
    required: false,
  },
  preferences: {
    type: Array,
    required: false
  },
  ingredients: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'recipeingredients'
    }
  ],
  steps: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'recipesteps'
    }
  ],
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

module.exports = mongoose.model('recipes', recipeSchema);
