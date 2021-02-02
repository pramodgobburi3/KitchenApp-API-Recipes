'use strict'
const express = require('express');
const router = express.Router();
const bodyValidator = require('express-validation');
const mongoose = require('mongoose');
const { DateTime } = require('luxon');
const authMiddleware = require('../middlewares/auth');
const groceryListMiddleware = require('../middlewares/grocery_list');
const groceryListController = require('../controllers/grocery_list');
const { captureException } = require('../helpers/logging');
const responseHelper = require('../helpers/responses');
const listItemRoutes = require('./list_item');

router.use('/:list_id/items', listItemRoutes);

const create_grocery_list = require('../validation/create_grocery_list');
const generate_grocery_list = require('../validation/generate_grocery_list');
const update_grocery_list = require('../validation/update_grocery_list');
const edit_grocery_list = require('../validation/edit_grocery_list');


router.post('/create',
  authMiddleware.verifyAccessToken(true),
  bodyValidator(create_grocery_list),
  async (req, res) => {
    try {
      let listItems = [];
      await Promise.all(req.body.items.map( async item => {
        let listItem = await mongoose.model('listitems').create({
          quantity: item.quantity,
          unit: item.unit,
          name: item.name,
          is_fulfilled: item.is_fulfilled,
          type: 'custom',
          note: item.note,
          created_by: req.user.user_id,
          updated_by: req.user.user_id
        });
        listItems.push(listItem);
      }));

      let list = await mongoose.model('grocerylists').create({
        name: req.body.name,
        start_date: null,
        end_date: null,
        type: 'custom',
        items: listItems,
        meals: [],
        created_by: req.user.user_id,
        updated_by: req.user.user_id
      });

      return responseHelper.returnSuccessResponse(req, res, true, list);
    } catch (error) {
      captureException(error);
      return responseHelper.returnInternalServerError(req, res, new String(error));  
    }
  }
);

router.post('/generate',
  authMiddleware.verifyAccessToken(true),
  bodyValidator(generate_grocery_list),
  async (req, res) => {
    try {
      // TODO: Validate start-date and end_date
      let name = groceryListController.generateGroceryListName(req.body.start_date, req.body.end_date);
      
      let aggregate = await groceryListController.aggregateGroceryListItemsByDate(req.body.start_date, req.body.end_date, req.user.user_id);

      let listItems = groceryListController.consolidateListItems( aggregate.meals, aggregate.list_items, req.user.user_id);
      console.log(listItems);
      let items = [];
      await Promise.all(listItems.map(async listItem => {
        let item = await mongoose.model('listitems').create(listItem);
        items.push(item);
      }));

      let list = await mongoose.model('grocerylists').create({
        name: name,
        start_date: req.body.start_date,
        end_date: req.body.end_date,
        type: 'generated',
        items: items,
        meals: aggregate.meals,
        created_by: req.user.user_id,
        updated_by: req.user.user_id
      });


      return responseHelper.returnSuccessResponse(req, res, true, list);
    } catch (error) {
      captureException(error);
      return responseHelper.returnInternalServerError(req, res, new String(error));  
    }
  }
);

router.put('/:list_id/update',
  authMiddleware.verifyAccessToken(true),
  bodyValidator(update_grocery_list),
  groceryListMiddleware.checkGroceryListExists,
  groceryListMiddleware.checkGroceryListOwnership,
  groceryListMiddleware.checkGroceryListType('generated'),
  async (req, res) => {
    try {

      // TODO: Validate start_date & end_date
      let name = groceryListController.generateGroceryListName(req.body.start_date, req.body.end_date);

      let aggregate = await groceryListController.aggregateGroceryListItemsByDate(req.body.start_date, req.body.end_date, req.user.user_id);
      
      let listItems = await groceryListController.consolidateListItems(aggregate.meals, aggregate.list_items, req.user.user_id);

      let list = await mongoose.model('grocerylists').findOne({grocery_list_id: req.params.list_id});
      await mongoose.model('listitems').deleteMany(
        {
          _id: {$in: list.items},
          type: 'generated',
          created_by: req.user.user_id,
        });
      
      list = await mongoose.model('grocerylists').findOne({grocery_list_id: req.params.list_id});
      
      let customItems = await mongoose.model('listitems').find({
        _id: {$in: list.items},
        type: {$ne: 'generated'},
        created_by: req.user.user_id
      });
      
      let items = [];
      await Promise.all(listItems.map(async listItem => {
        let item = await mongoose.model('listitems').create(listItem);
        items.push(item);
      }));
      // ! Causes Issues (ObjectId Cast)
      if (customItems.length > 0) {
        items.push(...customItems);
      }

      list = await mongoose.model('grocerylists').findOneAndUpdate(
        {grocery_list_id: req.params.list_id},
        {$set: { name: name,
          start_date: req.body.start_date,
          end_date: req.body.end_date,
          type: 'generated',
          items: items,
          meals: aggregate.meals,
          updated_by: req.user.user_id
        }},
        {new: true}
      );
      
      return responseHelper.returnSuccessResponse(req, res, true, list);
    } catch(error) {
      captureException(error);
      return responseHelper.returnInternalServerError(req, res, new String(error));
    }
  }
);

router.put('/:list_id/edit', 
  authMiddleware.verifyAccessToken(true),
  bodyValidator(edit_grocery_list),
  groceryListMiddleware.checkGroceryListExists,
  groceryListMiddleware.checkGroceryListOwnership,
  async (req, res) => {
    try {
      let list = req.grocery_list;

      list = await mongoose.model('grocerylists').findOneAndUpdate({grocery_list_id: req.params.list_id},
        {$set: {name: req.body.name}}, {new: true});
      
      return responseHelper.returnSuccessResponse(req, res, true, list);
    } catch (error) {
      captureException(error);
      return responseHelper.returnInternalServerError(req, res, new String(error));
    }
  }
);

router.delete('/:list_id/delete',
  authMiddleware.verifyAccessToken(true),
  groceryListMiddleware.checkGroceryListExists,
  groceryListMiddleware.checkGroceryListOwnership,
  async (req, res) => {
    try {
      let list = req.grocery_list;

      await mongoose.model('listitems').deleteMany({_id: {$in: list.items}});
      await mongoose.model('grocerylists').deleteOne({grocery_list_id: req.params.list_id});

      return responseHelper.returnSuccessResponse(req, res, false, {});
    } catch (error) {
      captureException(error);
      return responseHelper.returnInternalServerError(req, res, new String(error));
    }
  }
);


module.exports = router;