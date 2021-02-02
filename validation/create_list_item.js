const Joi = require('joi');

module.exports = {
  body: {
    quantity: Joi.number().required(),
    unit: Joi.string().required(),
    name: Joi.string().required(),
    note: Joi.string()
  }
}