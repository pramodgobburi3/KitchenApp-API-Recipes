'use strict'
const express = require('express');
const router = express.Router({mergeParams: true});
const bodyValidator = require('express-validation');
const mongoose = require('mongoose');
const authMiddleware = require('../middlewares/auth');
const listItemMiddleware = require('../middlewares/list_items');
const responseHelper = require('../helpers/responses');
const { captureException } = require('../helpers/logging');
const { clean } = require('../helpers/cleaner');

const create_list_item = require('../validation/create_list_item');

router.post('/create',
  authMiddleware.verifyAccessToken(true),
  bodyValidator(create_list_item),
  async (req, res) => {
    try {
      let list = await mongoose.model('grocerylists').findOne({
        grocery_list_id: req.params.list_id
      });

      let item = await mongoose.model('listitems').create({
        quantity: req.body.quantity,
        unit: req.body.unit,
        name: req.body.name,
        type: 'custom',
        note: req.body.note,
        created_by: req.user.user_id,
        updated_by: req.user.user_id
      });

      let items = list.items;
      items.push(item);

      list = await list.updateOne({items: items}, {updated_by: req.user.user_id});

      return responseHelper.returnSuccessResponse(req, res, true, item);
    } catch (error) {
      captureException(error);
      return responseHelper.returnInternalServerError(req, res, new String(error));
    }
  }
);

router.put('/:id/update',
  authMiddleware.verifyAccessToken(true),
  listItemMiddleware.checkListItemExists,
  listItemMiddleware.checkListItemOwnership,
  async (req, res) => {
    try {
      let itemUpdate = {
        quantity: req.body.quantity,
        unit: req.body.unit,
        name: req.body.name,
        type: 'custom',
        note: req.body.note,
        updated_by: req.user.user_id
      };

      let cleaned = clean(itemUpdate);
      let item = await mongoose.model('listitems').findOneAndUpdate({list_item_id: req.params.id}, cleaned, {new: true});

      return responseHelper.returnSuccessResponse(req, res, true, item);
    } catch (error) {
      captureException(error);
      return responseHelper.returnInternalServerError(req, res, new String(error));
    }
  }
);

router.put('/:id/toggle',
  authMiddleware.verifyAccessToken(true),
  listItemMiddleware.checkListItemExists,
  listItemMiddleware.checkListItemOwnership,
  async (req, res) => {
    try {
      let listItem = req.list_item;

      let isFulfilled = undefined;

      if (req.list_item.is_fulfilled) {
        isFulfilled = false;
      } else {
        isFulfilled = true;
      }

      listItem = await mongoose.model('listitems').findOneAndUpdate({list_item_id: req.params.id},
        {$set: {is_fulfilled: isFulfilled}}, {new: true});

      return responseHelper.returnSuccessResponse(req, res, true, listItem);
    } catch (error) {
      captureException(error);
      return responseHelper.returnInternalServerError(req, res, new String(error));
    }
  }
);

router.delete('/:id/delete',
  authMiddleware.verifyAccessToken(true),
  listItemMiddleware.checkListItemExists,
  listItemMiddleware.checkListItemOwnership,
  async (req, res) => {
    try {

      await mongoose.model('listitems').deleteOne({ list_item_id: req.params.id });

      let list = await mongoose.model('grocerylists').findOne({ grocery_list_id: req.params.list_id });
      let remainingItems = await mongoose.model('listitems').find({_id: {$in: list.items}});

      list = await mongoose.model('grocerylists').findOneAndUpdate({ grocery_list_id: list.grocery_list_id}, 
        {items: remainingItems}, {new: true});

      return responseHelper.returnSuccessResponse(req, res, false, {});

    } catch (error) {
      captureException(error);
      return responseHelper.returnInternalServerError(req, res, new String(error));
    }
  }
)

module.exports = router