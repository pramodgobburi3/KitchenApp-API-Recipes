'use strict'

const express = require('express');
const router = express.Router();
const cors = require('cors');

const recipeRoutes = require('./recipe');
const mealRoutes = require('./meal');
const groceryListRoutes = require('./grocery_list');
const krogerSDK = require('../sdks/kroger');
const { returnSuccessResponse, returnBadRequest } = require('../helpers/responses');

const allowedOrigins = ['http://localhost:3000', 'http://localhost:8000'];

router.use(cors({
  credentials: true,
  origin: function(origin, callback) {
    // allow requests with no origin
    // like mobile apps or curl requests
    if(!origin) return callback(null, true);
    if(allowedOrigins.indexOf(origin) === -1) {
      var msg = 'The CORS policy for this site does not ' +
        'allow access from the specified Origin.';
      return callback(new Error(msg), false);
    }
    return callback(null, true);
  }
}));

router.use('/recipes', recipeRoutes);
router.use('/meals', mealRoutes);
router.use('/lists', groceryListRoutes);

router.get('/test', async function (req, res) {
  try {
    let resp = await krogerSDK.searchProductsByTerm('chicken', '03400394')
    console.log('resp', resp);
    return returnSuccessResponse(req, res, true, resp);
  } catch (e) {
    console.log(e);
    return returnBadRequest(req, res, "Something went wrong");
  }
})

module.exports = router;