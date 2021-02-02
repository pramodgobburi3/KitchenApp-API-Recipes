const mongoose = require('mongoose');
const {v4: uuid} = require('uuid');

const groceryListSchema = new mongoose.Schema({
  grocery_list_id: {
    type: String,
    default: () => uuid(),
    required: true,
    unique: true
  },
  name: {
    type: String,
    required: true,
  },
  start_date: {
    type: Date,
    required: false,
  },
  end_date: {
    type: Date,
    required: false,
  },
  type: {
    type: String,
    required: true,
  },
  items: [{
    type: mongoose.Schema.ObjectId,
    ref: 'listitems',
    required: true,
  }],
  meals: [{
    type: mongoose.Schema.ObjectId,
    ref: 'meals',
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

module.exports = mongoose.model('grocerylists', groceryListSchema);