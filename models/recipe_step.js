const mongoose = require('mongoose');
const {v4: uuid} = require('uuid');

const recipeStepSchema = new mongoose.Schema({
  step_id: {
    type: String,
    default: uuid(),
    required: true,
    unique: true
  },
  step_number: {
    type: Number,
    required: true
  },
  time: {
    type: String,
    required: false
  },
  description: {
    type: String,
    required: true,
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

const RecipeStep = mongoose.model('recipesteps', recipeStepSchema);
module.exports = RecipeStep;