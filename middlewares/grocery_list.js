const mongoose = require('mongoose');
const { captureException } = require('../helpers/logging');
const responseHelper = require('../helpers/responses');

module.exports = {
  checkGroceryListExists: async (req, res, next) => {
    try {
      let list = await mongoose.model('grocerylists').findOne({grocery_list_id: req.params.list_id})
      .populate('items');
      if (list) {
        req.grocery_list = list;
        next();
      } else {
        return responseHelper.returnNotFound(req, res, "Resource not found.")
      }
    } catch(error) {
      captureException(error);
      return responseHelper.returnInternalServerError(req, res, new String(error));
    }
  },

  checkGroceryListOwnership: (req, res, next) => {
    try {
      let list = req.grocery_list;
      if (list.created_by == req.user.user_id) {
        next();
      } else {
        return responseHelper.returnForbiddenResponse(req, res, "Unauthorized access to requested resource.")
      }
    } catch(error) {
      captureException(error);
      return responseHelper.returnInternalServerError(req, res, new String(error));
    }
  },

  checkGroceryListType: (expectedType) => {
    return (req, res, next) => {
      try {
        if (req.grocery_list.type == expectedType) {
          next()
        }
        else {
          return responseHelper.returnBadRequest(req, res, 'Unauthorized operation on requested resource.')
        }
      } catch (error) {
        captureException(error);
        return responseHelper.returnInternalServerError(req, res, new String(error));
      }
    }
  }
}