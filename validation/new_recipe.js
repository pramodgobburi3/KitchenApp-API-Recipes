const Joi = require('joi');

module.exports = {
  body: {
    name: Joi.string().required(),
    description: Joi.string().allow(null).allow(''),
    prep_time: Joi.string().allow(null).allow(''),
    cuisine: Joi.string().allow(null).allow(''),
    cook_time: Joi.string().allow(null).allow(''),
    difficulty: Joi.number().allow(null).allow(''),
    rating: Joi.number().min(0).max(5).allow(null).allow(''),
    special_requirements: Joi.string().allow(null).allow(''),
    author: Joi.string().allow(null).allow(''),
    accessibility: Joi.string().allow(null).allow(''),
    type: Joi.string().required(),
    source: Joi.string().allow(null).allow(''),
    serving_size: Joi.number().allow(null).allow(''),
    allergies: Joi.array().items(Joi.string()).allow([]).allow(null),
    tags: Joi.array().items(Joi.string()).allow([]).allow(null),
    preferences: Joi.array().items(Joi.string()).allow([]).allow(null),
    ingredients: Joi.array().items(Joi.string()).required(),
    instructions: Joi.string().required(),
    media: Joi.array().items(Joi.string()).allow([]).allow(null),
    nutrition: Joi.object().keys({
      calories: Joi.number().allow(null),
      total_fat: Joi.string().allow(null).allow(''),
      trans_fat: Joi.string().allow(null).allow(''),
      saturated_fat: Joi.string().allow(null).allow(''),
      cholesterol: Joi.string().allow(null).allow(''),
      sodium: Joi.string().allow(null).allow(''),
      total_carbohydrates: Joi.string().allow(null).allow(''),
      fiber: Joi.string().allow(null).allow(''),
      sugar: Joi.string().allow(null).allow(''),
      protein: Joi.string().allow(null).allow(''),
      vitamins: Joi.array().items(Joi.object().keys({
        name: Joi.string().required(),
        value: Joi.string().required()
      })).allow([]).allow(null)
    }).allow(null).allow({})
  }
}