'use strict'
const express = require('express');
const router = express.Router();
const bodyValidator = require('express-validation');
const mongoose = require('mongoose');
const authMiddleware = require('../middlewares/auth');
const mealMiddleware = require('../middlewares/meal');
const responseHelper = require('../helpers/responses');
const mealController = require('../controllers/meal');
const groceryListController = require('../controllers/grocery_list');
const { clean } = require('../helpers/cleaner');
const { captureException } = require('../helpers/logging');

const create_meal = require('../validation/create_meal');


router.post('/create', 
  authMiddleware.verifyAccessToken(true),
  bodyValidator(create_meal),
  async (req, res) => {
    try {
      let recipes = await mongoose.model('recipes').find({
        recipe_id: { $in : req.body.recipes}
      });

      let valueAggregate = await mealController.calculateMealValues(req.body.recipes);

      const meal = await mongoose.model('meals').create({
        user_id: req.user.user_id,
        date: req.body.date,
        tags: valueAggregate.tags,
        name: req.body.name,
        total_calories: valueAggregate.total_calories,
        total_time: valueAggregate.total_time,
        total_time_units: valueAggregate.total_time_units,
        recipes: recipes,
        created_by: req.user.user_id,
        updated_by: req.user.user_id
      });
      
      return responseHelper.returnSuccessResponse(req, res, true, meal);
    } catch(error) {
      captureException(error);
      return responseHelper.returnInternalServerError(req, res, new String(error));
    }
  }
);

// Allows for the edit of a meal's tags, name, 
router.put('/:id/edit',
  authMiddleware.verifyAccessToken(true),
  mealMiddleware.checkMealExists,
  mealMiddleware.checkMealOwnership,
  async (req, res) => {
    try {
      let meal = req.meal;

      let recipes = await mongoose.model('recipes').find({_id: {$in: meal.recipes}});

      let recipeIds = [];
      recipes.map(recipe => {
        recipeIds.push(recipe.recipe_id);
      });

      let valueAggregate = await mealController.calculateMealValues(recipeIds);

      let mealUpdate = {
        user_id: meal.user_id,
        date: meal.date,
        tags: valueAggregate.tags,
        name: req.body.name,
        total_calories: valueAggregate.total_calories,
        total_time: valueAggregate.total_time,
        total_time_units: valueAggregate.total_time_units,
        recipes: meal.recipes,
        updated_by: req.user.user_id
      };

      let cleaned = clean(mealUpdate);
      meal = await mongoose.model('meals').findOneAndUpdate({meal_id: req.params.id},
        {$set: cleaned}, {new: true});

      return responseHelper.returnSuccessResponse(req, res, true, meal);

    } catch (error) {
      captureException(error);
      return responseHelper.returnInternalServerError(req, res, new String(error));
    }
  }
);

// ?: Client warning about changing related 'generated' grocery lists
// ?: Should we delete lists that have 0 items on it
// TODO: Calculate calories and time, determine time units
router.put('/:id/move', 
  authMiddleware.verifyAccessToken(true),
  mealMiddleware.checkMealExists,
  mealMiddleware.checkMealOwnership,
  async (req, res) => {
    try {
      let meal = req.meal;

      // TODO: Validate Date

      meal = await mongoose.model('meals').findOneAndUpdate({meal_id: req.params.id},
        {date: new Date(req.body.date)}, {new: true});

      // Find and Update List it was linked to (if applicable)
      let list = await groceryListController.findAndRemoveMealFromGroceryList(meal);
      if (list != null) {
        let aggregate = await groceryListController.aggregateGroceryListItems(list, req.user.user_id);
        let listItems = groceryListController.consolidateListItems(aggregate.meals, aggregate.list_items, req.user.user_id);
        await groceryListController.deleteGeneratedListItems(list.meals);
        let customItems = await groceryListController.fetchCustomListItems(list, req.user.userId);
        
        let items = [];
        await Promise.all(listItems.map(async listItem => {
          items.push(await mongoose.model('listitems').create(listItem));
        }));

        if (customItems.length > 0) {
          items.push(...customItems);
        }
        
        list = await mongoose.model('grocerylists').findOneAndUpdate(
          {grocery_list_id: list.grocery_list_id},
          {$set: { type: 'generated',
            items: items,
            meals: aggregate.meals,
            updated_by: req.user.user_id
          }},
          {new: true}
        );
      }


      // New Meal Date Flow (regenerate if meal is in an existing list)
      let groceryLists = await mongoose.model('grocerylists').find(
        { start_date: {$lte: req.body.date},
          end_date: {$gte: req.body.date},
          type: 'generated',
          created_by: req.user.user_id
        }
      ).populate('items');

      if (groceryLists.length > 0) {
  
        await Promise.all(groceryLists.map(async gList => {
          let listMeals = gList.meals;
          listMeals.push(meal);
          let groceryList = await mongoose.model('grocerylists').findOneAndUpdate(
            { grocery_list_id: gList.grocery_list_id },
            { meals: listMeals,
              updated_by: req.user.user_id
            },
            {new: true}
          );
          let listAggregate = await groceryListController.aggregateGroceryListItems(groceryList, req.user.user_id);
          let groceryListItems = groceryListController.consolidateListItems(aggregate.meals, listAggregate.list_items, req.user.user_id);
          await groceryListController.deleteGeneratedListItems(groceryList, req.user.user_id);
          let groceryCustomItems = await groceryListController.fetchCustomListItems(groceryList, req.user.user_id);
  
          let groceryItems = [];
          await Promise.all(groceryListItems.map(async gListItem => {
            groceryItems.push(await mongoose.model('listitems').create(gListItem));
          }));
  
          if (groceryCustomItems.length > 0) {
            groceryItems.push(...groceryCustomItems);
          }
  
          groceryList = await mongoose.model('grocerylists').findOneAndUpdate(
            {grocery_list_id: groceryList.grocery_list_id},
            {$set: { type: 'generated',
              items: groceryItems,
              meals: listAggregate.meals,
              updated_by: req.user.user_id
            }},
            {new: true}
          );
        }));
      }

      return responseHelper.returnSuccessResponse(req, res, true, {list: list, meal: meal});

    } catch (error) {
      captureException(error);
      return responseHelper.returnInternalServerError(req, res, new String(error));
    }
  }
);

router.delete('/:id/delete',
  authMiddleware.verifyAccessToken(true),
  mealMiddleware.checkMealExists,
  mealMiddleware.checkMealOwnership,
  async (req, res) => {
    try {
      let list = await groceryListController.findAndRemoveMealFromGroceryList(req.meal);
      if (list != null) {
        let aggregate = await groceryListController.aggregateGroceryListItems(list, req.user.user_id);
        let listItems = groceryListController.consolidateListItems(aggregate.meals, aggregate.list_items, req.user.user_id);
        await groceryListController.deleteGeneratedListItems(list.meals);
        let customItems = await groceryListController.fetchCustomListItems(list, req.user.user_id);

        let items = [];
        await Promise.all(listItems.map(async listItem => {
          items.push(await mongoose.model('listitems').create(listItem));
        }));

        if (customItems.length > 0) {
          items.push(...customItems);
        }

        list = await mongoose.model('grocerylists').findOneAndUpdate(
          {grocery_list_id: list.grocery_list_id},
          {$set: { type: 'generated',
            items: items,
            meals: aggregate.meals,
            updated_by: req.user.user_id
          }},
          {new: true}
        );
      }

      await mongoose.model('meals').deleteOne({meal_id: req.params.id});
      return responseHelper.returnSuccessResponse(req, res, false, {});

    } catch (error) {
      captureException(error);
      return responseHelper.returnInternalServerError(req, res, new String(error));
    }
  }
);

module.exports = router;