const mongoose = require('mongoose');
const { captureException } = require('../helpers/logging');
const responseHelper = require('../helpers/responses');

module.exports = {
  checkListItemExists: async (req, res, next) => {
    try {
      let item = await mongoose.model('listitems').findOne({list_item_id: req.params.id});
      if (item) {
        req.list_item = item;
        next();
      } else {
        return responseHelper.returnNotFound(req, res, 'Resource not found.')
      }
    } catch(error) {
      captureException(error);
      return responseHelper.returnInternalServerError(req, res, new String(error));
    }
  },

  checkListItemOwnership: (req, res, next) => {
    try {
      let item = req.list_item;
      if (item.created_by == req.user.user_id) {
        next();
      } else {
        return responseHelper.returnForbiddenResponse(req, res, "Unauthorized access to requested resource.")
      }
    } catch(error) {
      captureException(error);
      return responseHelper.returnInternalServerError(req, res, new String(error));
    }
  },

  checkListItemType: (expectedType) => {
    return (req, res, next) => {
      try {
        if (req.list_item.type == expectedType) {
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
}