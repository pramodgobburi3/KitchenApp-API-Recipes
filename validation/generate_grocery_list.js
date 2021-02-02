const Joi = require('joi');

module.exports = {
  body: {
    start_date: Joi.date().required(),
    end_date: Joi.date().required()
  }
}