const mongoose = require('mongoose');
const logging = require('../helpers/logging');
const responses = require('../helpers/responses');

module.exports = {
  checkRecipeOwnership: async function(req, res, next) {
    try {
      let recipe = await mongoose.model('recipes').findOne({
        recipe_id: req.params.id
      })
      .populate('media')
      .populate('ingredients')
      .populate('steps');
      if (recipe) {
        if (recipe.created_by === req.user.user_id) {
          req.recipe = recipe;
          next();
        } else {
          return responses.returnForbiddenResponse(req, res, "Unauthorized access to requested resource");
        }
      } else {
        return responses.returnNotFound(req, res, "No recipe found");
      }
    } catch (error) {
      logging.captureException(error);
      return responses.returnBadRequest(req, res, "Something went wrong, please try again");
    }
  },
  checkRecipeReadAccess: async function(req, res, next) {
    try {
      let recipe = await mongoose.model('recipes').findOne({
        recipe_id: req.params.id
      })
      .populate('media')
      .populate('ingredients')
      .populate('nutrition')
      .populate('steps');
      if (recipe) {
        if (recipe.accessibility === 'PUBLIC') {
          req.recipe = recipe;
          next();
        } else {
          if (req.user != 'anonymous' && recipe.created_by === req.user.user_id) {
            req.recipe = recipe;
            next();
          } else {
            return responses.returnForbiddenResponse(req, res, "Unauthorized access to requested resource");
          }
        }
      } else {
        return responses.returnNotFound(req, res, "No recipe found");
      }
    } catch (error) {
      logging.captureException(error);
      return responses.returnBadRequest(req, res, "Something went wrong, please try again");
    }
  }
}