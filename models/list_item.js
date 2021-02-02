const mongoose = require('mongoose');
const {v4: uuid} = require('uuid');

const listItemSchema = new mongoose.Schema({
  list_item_id: {
    type: String,
    default: () => uuid(),
    required: true,
    unique: true,
  },
  recipe_ingredient_ids: [{
    type: String,
    required: false
  }],
  quantity: {
    type: Number,
    required: false,
  },
  unit: {
    type: String,
    required: false,
  },
  name: {
    type: String,
    required: false,
  },
  is_fulfilled: {
    type: Boolean,
    required: true,
    default: false
  },
  type: {
    type: String,
    required: true,
  },
  note: {
    type: String,
    required: false,
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

module.exports = mongoose.model('listitems', listItemSchema);