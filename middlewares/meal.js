const mongoose = require('mongoose');
const { captureException } = require('../helpers/logging');
const responseHelper = require('../helpers/responses');

module.exports = {
  checkMealExists: async (req, res, next) => {
    try {
      let meal = await mongoose.model('meals').findOne({meal_id: req.params.id});
      if (meal) {
        req.meal = meal;
        next();
      } else {
        return responseHelper.returnNotFound(req, res, "Resource not found.")
      }
    } catch(error) {
      captureException(error);
      return responseHelper.returnInternalServerError(req, res, new String(error));
    }
  },

  checkMealOwnership: async (req, res, next) => {
    try {
      let meal = req.meal;
      if (meal.created_by == req.user.user_id) {
        next();
      } else {
        return responseHelper.returnForbiddenResponse(req, res, "Unauthorized access to requested resource.")
      }
    } catch(error) {
      captureException(error);
      return responseHelper.returnInternalServerError(req, res, new String(error));
    }
  }
}