const Joi = require('joi');

module.exports = {
  body: {
    date: Joi.date().iso().allow(null),
    name: Joi.string(),
    recipes: Joi.array().items(Joi.string()).required()
  }
}