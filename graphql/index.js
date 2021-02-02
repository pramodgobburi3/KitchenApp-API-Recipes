const { makeExecutableSchema } = require('apollo-server-express');
const { applyMiddleware } = require('graphql-middleware');
const {merge} = require('lodash');
const { typeDefs: Date, resolvers: dateResolvers } = require('./custom_scalars/date');
const { typeDefs: Recipe, resolvers: recipeResolvers, middleware: recipeMiddleware } = require('./recipe');
const { typeDefs: GroceryList, resolvers: groceryListResolvers, middleware: groceryListMiddleware } = require('./grocery_list');
const { typeDefs: ListItem, resolvers: listItemResolvers, middleware: listItemMiddleware } = require('./list_item');
const { typeDefs: Meal, resolvers: mealResolvers, middleware: mealMiddleware } = require('./meal');

const typeDefs = `
  type Query {
    _empty: String
  }
`;

const schema = makeExecutableSchema({
  typeDefs: [typeDefs, Recipe, GroceryList, ListItem, Meal, Date],
  resolvers: merge(recipeResolvers, groceryListResolvers, listItemResolvers, mealResolvers, dateResolvers)
});

const schemaWithMiddleware = applyMiddleware(
  schema,
  recipeMiddleware,
  groceryListMiddleware,
  listItemMiddleware,
  mealMiddleware
);

module.exports = {
  schema: schemaWithMiddleware
}