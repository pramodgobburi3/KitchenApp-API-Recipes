const Joi = require('joi');

module.exports = {
  body: {
    start_date: Joi.date(),
    end_date: Joi.date()
  }
}