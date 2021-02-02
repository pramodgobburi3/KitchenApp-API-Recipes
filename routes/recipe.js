'use strict'
const express = require('express');
const router = express.Router();
const bodyValidator = require('express-validation');
const mongoose = require('mongoose');
const {v4: uuid} = require('uuid');
const {parse} = require('recipe-ingredient-parser-v2');

const authMiddleware = require('../middlewares/auth');
const recipeMiddleware = require('../middlewares/recipe');

const responseHelper = require('../helpers/responses');
const { generateMediaUrl } = require('../sdks/aws');
const { captureException } = require('../helpers/logging');
const recipeSchema = require('../validation/new_recipe');
const { clean } = require('../helpers/cleaner');
const pubsub = require('../redis');
const { addRecipe } = require('../sdks/elasticsearch');

async function buildMedia(req) {
  let media = req.body.media;
  return Promise.all(
    media.map(medium => {
      return mongoose.model('media').create({
        medium_id: uuid(),
        type: medium.type,
        url: medium.url,
        created_by: req.user.user_id,
        updated_by: req.user.user_id
      });
    })
  );
};

async function buildNutrition(req) {
  let nutrition = req.body.nutrition;
  if (nutrition) {
    return mongoose.model('recipenutritions').create({
      nutrition_id: uuid(),
      calories: nutrition.calories,
      total_fat: nutrition.total_fat,
      trans_fat: nutrition.trans_fat,
      saturated_fat: nutrition.saturated_fat,
      cholesterol: nutrition.cholesterol,
      sodium: nutrition.sodium,
      total_carbohydrates: nutrition.total_carbohydrates,
      fiber: nutrition.fiber,
      sugar: nutrition.sugar,
      protein: nutrition.protein,
      vitamins: nutrition.vitamins,
      created_by: req.user.user_id,
      updated_by: req.user.user_id
    });
  }
  return null; 
}

async function buildIngredients(req) {
  let ingredients = req.body.ingredients;
  return Promise.all(
    ingredients.map(ingredient => {
      if(ingredient) {
        try {
          let parsed = parse(ingredient);
          let minQuantity = null;
          let maxQuantity = null;
          if (parsed.quantity && parsed.quantity.includes("-")) {
            minQuantity = parsed.quantity.split("-")[0].trim();
            maxQuantity = parsed.quantity.split("-")[0].trim();
          } else {
            minQuantity = parsed.quantity;
          }
          if (minQuantity) {
            minQuantity = minQuantity.replace(/(^.+\D)(\d+)(\D.+$)/i,'$2');
          }
          if (maxQuantity) {
            maxQuantity = maxQuantity.replace(/(^.+\D)(\d+)(\D.+$)/i,'$2');
          }
          return mongoose.model('recipeingredients').create({
            ingredient_id: uuid(),
            raw: ingredient,
            min_quantity: minQuantity,
            max_quantity: maxQuantity,
            unit: parsed.unit,
            name: parsed.ingredient.split(',')[0],
            created_by: req.user.user_id,
            updated_by: req.user.user_id
          });
        }
        catch (err) {
          console.log('Failed Ingredient build', err);
        }
      }
    })
  );
};

async function buildSteps(req) {
  let steps = req.body.instructions.split('\n');
  return Promise.all(
    steps.map((step, idx) => {
      return mongoose.model('recipesteps').create({
        step_id: uuid(),
        step_number: idx + 1,
        description: step,
        created_by: req.user.user_id,
        updated_by: req.user.user_id
      });
    })
  );
}

async function removeOldMediaIngredientsSteps(recipe) {
  try {
    let oldMediaIds = recipe.media.map(m => m._id);
    let oldIngredientIds = recipe.ingredients.map(i => i._id);
    let oldStepsIds = recipe.steps.map(s => s._id);

    if (oldMediaIds.length > 0) {
      await mongoose.model('media').deleteMany({
        _id: {$in: oldMediaIds}
      })
    }
    if (oldIngredientIds.length > 0) {
      await mongoose.model('recipeingredients').deleteMany({
        _id: {$in: oldIngredientIds}
      })
    }
    if (oldStepsIds.length > 0) {
      await mongoose.model('recipesteps').deleteMany({
        _id: {$in: oldStepsIds}
      })
    }
  } catch (err) {
    throw err;
  }
}

router.post('/create',
  bodyValidator(recipeSchema),
  authMiddleware.verifyAccessToken(true),
  async function(req, res) {
    try {
      const media = await buildMedia(req);
      const ingredients = await buildIngredients(req);
      const steps = await buildSteps(req);
      const nutrition = await buildNutrition(req);
      const recipe = await mongoose.model('recipes').create({
        recipe_id: uuid(),
        name: req.body.name,
        cuisine: req.body.cuisine,
        description: req.body.description,
        prep_time: req.body.prep_time,
        cook_time: req.body.cook_time,
        difficulty: req.body.difficulty,
        rating: req.body.rating,
        special_requirements: req.body.special_requirements,
        author: req.body.author,
        accessibility: req.body.accessibility,
        type: req.body.type,
        source: req.body.source,
        serving_size: req.body.serving_size,
        allergies: req.body.allergies,
        nutrition: nutrition,
        tags: req.body.tags,
        preferences: req.body.preferences,
        created_by: req.user.user_id,
        updated_by: req.user.user_id,
        media: media,
        ingredients: ingredients,
        steps: steps
      });
      await addRecipe(recipe);
      pubsub.publish('RECIPE', { recipes: { action: 'CREATE', data: recipe }});
      return responseHelper.returnSuccessResponse(req, res, true, recipe);
    }
    catch (error) {
      captureException(error);
      return responseHelper.returnInternalServerError(req, res, new String(error));
    }
  }
);

router.get('/:id',
  authMiddleware.verifyAccessToken(false),
  recipeMiddleware.checkRecipeReadAccess,
  async function(req, res) {
    try {
      let recipe = req.recipe;
      if (recipe) {
        return responseHelper.returnSuccessResponse(req, res, true, recipe);
      } else {
        return responseHelper.returnNotFound(req, res, "No recipe found");
      }
    } catch (error) {
      captureException(error);
      return responseHelper.returnInternalServerError(req, res, error);
    }
  }
);

router.put('/:id',
  authMiddleware.verifyAccessToken(true),
  recipeMiddleware.checkRecipeOwnership,
  async function(req, res) {
    try {
      await removeOldMediaIngredientsSteps(req.recipe);
      const media = await buildMedia(req);
      const ingredients = await buildIngredients(req);
      const steps = await buildSteps(req);
      let recipeUpdate = {
        name: req.body.name,
        description: req.body.description,
        prep_time: req.body.prep_time,
        cook_time: req.body.cook_time,
        difficulty: req.body.difficulty,
        rating: req.body.rating,
        special_requirements: req.body.special_requirements,
        author: req.body.author,
        accessibility: req.body.accessibility,
        type: req.body.type,
        source: req.body.source,
        serving_size: req.body.serving_size,
        allergies: req.body.allergies,
        calories: req.body.calories,
        tags: req.body.tags,
        preferences: req.body.preferences,
        created_by: req.user.user_id,
        updated_by: req.user.user_id,
        media: media,
        ingredients: ingredients,
        steps: steps
      };
      let cleaned = clean(recipeUpdate);
      let condition = {
        recipe_id: req.params.id
      };
      let recipe = await mongoose.model('recipes').findOneAndUpdate(condition, {$set: cleaned}, {"new": true})
      .populate('media')
      .populate('ingredients')
      .populate('steps').exec();
      pubsub.publish('RECIPE', { recipes: { action: 'UPDATE', data: recipe }});
      return responseHelper.returnSuccessResponse(req, res, true, recipe);
    } catch (error) {
      captureException(error);
      return responseHelper.returnInternalServerError(req, res, error);
    }
  }
);

router.get('/:id/media/signed-url',
  authMiddleware.verifyAccessToken(true),
  recipeMiddleware.checkRecipeOwnership,
  async function(req, res) {
    try {
      const key = req.params.id;
      const {ContentType} = req.query;
      console.log(ContentType);
      let url = await generateMediaUrl(key, contentType);
      return responseHelper.returnSuccessResponse(req, res, true, url);
    } catch (error) {
      captureException(error);
      return responseHelper.returnInternalServerError(req, res, error);
    }
  }
);

router.post('/:id/media',
  authMiddleware.verifyAccessToken(true),
  recipeMiddleware.checkRecipeOwnership,
  async function(req, res) {
    try {
      let recipe = req.recipe;
      if (recipe) {
        let newMedia = await mongoose.model('media').create({
          medium_id: uuid(),
          priority: req.body.priority,
          url: req.body.url,
          type: req.body.type,
          created_by: req.user.user_id,
          updated_by: req.user.user_id
        });
        recipe.media.push(newMedia);
        recipe.save();
        return responseHelper.returnSuccessResponse(req, res, true, recipe);
      } else {
        return responseHelper.returnNotFound(req, res, "No recipe found");
      }
    } catch (error) {
      captureException(error);
      return responseHelper.returnInternalServerError(req, res, error);
    }
  }
);

module.exports = router;