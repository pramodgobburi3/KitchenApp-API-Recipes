const Joi = require('joi');

module.exports = {
  body: {
    items: Joi.array().items(Joi.object({
      quantity: Joi.number(),
      unit: Joi.string(),
      name: Joi.string(),
      is_fulfilled: Joi.boolean(),
      note: Joi.string().allow(null),
    })).required(),
    name: Joi.string().default('New List')
  }
}