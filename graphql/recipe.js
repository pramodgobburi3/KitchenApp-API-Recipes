const mongoose = require('mongoose');
const { withFilter } = require('apollo-server-express');
const { applyMiddleware } = require('graphql-middleware');
const { makeExecutableSchema } = require('graphql-tools');
const pubsub = require('../redis');
const { searchRecipe } = require('../sdks/elasticsearch');

const recipeMiddleware = {
  Query: {
    recipes: async (resolve, parent, args, context, info) => {
      // You can use middleware to override arguments
      console.log(context);
      let resp = await resolve(parent, args, context, info);
      return resp;
    },
  },
};

const typeDefs = `
  type Subscription { recipes: SubscribeData! }
  type SubscribeData {
    action: String!,
    data: Recipe!
  }
  extend type Query { 
    recipe(id: String!): Recipe,
    recipes(page: Int, limit: Int, search: String): RecipeWithPagination
  }
  type RecipeWithPagination {
    total: Int,
    recipes: [Recipe]
  }
  type Media {
    medium_id: String!,
    priority: Int,
    url: String!,
    type: String!,
    created_by: String,
    updated_by: String,
    created_at: Date,
    updated_at: Date
  }
  type Ingredient {
    ingredient_id: String!,
    name: String!,
    type: String,
    quantity: Float,
    unit: String,
    raw: String,
    rating: String,
    media: [Media],
    created_by: String,
    updated_by: String,
    created_at: Date,
    updated_at: Date
  }
  type Step {
    step_id: String!,
    step_number: Int,
    time: String,
    description: String!,
    created_by: String,
    updated_by: String,
    created_at: Date,
    updated_at: Date
  }
  type Vitamin {
    name: String,
    value: String
  }
  type Nutrition {
    nutrition_id: String!,
    calories: Int,
    total_fat: String,
    trans_fat: String,
    saturated_fat: String,
    cholesterol: String,
    sodium: String,
    total_carbohydrates: String,
    fiber: String,
    sugar: String,
    protein: String,
    vitamins: [Vitamin],
    created_by: String,
    updated_by: String,
    created_at: Date,
    updated_at: Date
  }
  type Recipe {
    recipe_id: String!,
    name: String!,
    description: String,
    prep_time: String,
    cook_time: String,
    difficulty: Int,
    rating: Int,
    special_requirements: String,
    author: String,
    accessibility: String,
    type: String,
    source: String,
    serving_size: String,
    allergies: [String],
    tags: [String],
    preferences: [String],
    ingredients: [Ingredient],
    nutrition: Nutrition,
    media: [Media],
    steps: [Step]
    created_by: String,
    updated_by: String,
    created_at: Date,
    updated_at: Date
  }
`;

const resolvers = {
  Query: {
    recipes: async (parent, args, context, info) => {
      try {
        let page = 1;
        let limit = 20;
        let skip = 0;
        if (args.page) {
          page = args.page
        }
        if (args.limit <= 100) {
          limit = args.limit;
        }
        skip = (page - 1) * limit;
        if (!args.search || args.search === '') {
          if (context.user === 'anonymous') {
            let total = await mongoose.model('recipes').find({
              accessibility: "PUBLIC"
            }).count();
            let recipes = await mongoose.model('recipes').find({
              accessibility: "PUBLIC"
            }).skip(skip).limit(limit).populate('ingredients')
            .populate('media')
            .populate('steps')
            .populate('nutrition');

            return {
              total,
              recipes
            };
          } else {
            let total = await mongoose.model('recipes').find({
              $or: [
                {
                  accessibility: "PUBLIC"
                },
                {
                  $and: [
                    {
                      accessibility: "PRIVATE",
                      created_by: context.user.user_id
                    }
                  ]
                }
              ]
            }).count();
            let recipes = await mongoose.model('recipes').find({
              $or: [
                {
                  accessibility: "PUBLIC"
                },
                {
                  $and: [
                    {
                      accessibility: "PRIVATE",
                      created_by: context.user.user_id
                    }
                  ]
                }
              ]
            }).skip(skip).limit(limit).populate('ingredients')
            .populate('media')
            .populate('steps')
            .populate('nutrition');

            return {
              total,
              recipes
            };
          }
        } else {
          let query = {
            query: {
              wildcard: {
                name: {
                  value: '*' + args.search + '*'
                }
              }
            }
          }
          let type = 'meal';
          if (args.type) {
            type = args.type
          }
          let search_results = await searchRecipe(type, query);
          if (search_results.hits.hits.length > 0) {
            let recipeIds = [];
            search_results.hits.hits.map(hit => {
              recipeIds.push(hit._id);
            });
            if (recipeIds.length > limit) {
              console.log(skip, limit)
              recipeIds = recipeIds.slice(skip, limit);
              console.log(recipeIds);
            }
            if (context.user === 'anonymous') {
              let recipes = await mongoose.model('recipes').find({
                recipe_id: { $in: recipeIds },
                accessibility: "PUBLIC"
              });
              return {
                total: recipes.length,
                recipes: recipes
              }
            } else {
              console.log(recipeIds);
              let recipes = await mongoose.model('recipes').find({
                recipe_id: { $in: recipeIds },
                $or: [
                  {
                    accessibility: "PUBLIC"
                  },
                  {
                    $and: [
                      {
                        accessibility: "PRIVATE",
                        created_by: context.user.user_id
                      }
                    ]
                  }
                ]
              });
              console.log(recipes);
              return {
                total: recipes.length,
                recipes: recipes
              }
            }
          } else {
            return {
              total: 0,
              recipes: []
            }
          }
        }
      } catch (err) {
        console.log(err);
        throw new ApolloError("Something went wrong, please try again", "BAD REQUEST");
      }
    },
    recipe: async (parent, args, context, info) => {
      try {
        if (context.user === 'anonymous') {
          let recipe = await mongoose.model('recipes').findOne({
            recipe_id: args.id,
            accessibility: "PUBLIC"
          }).populate('ingredients')
          .populate('media')
          .populate('steps')
          .populate('nutrition');
          return recipe;
        } else {
          let recipe = await mongoose.model('recipes').findOne({
            recipe_id: args.id,
            $or: [
              {
                accessibility: "PUBLIC"
              },
              {
                $and: [
                  {
                    accessibility: "PRIVATE",
                    created_by: context.user.user_id
                  }
                ]
              }

            ]
          }).populate('ingredients')
          .populate('media')
          .populate('steps')
          .populate('nutrition');
          return recipe;
        }
      } catch (err) {
        console.log(err);
        throw new ApolloError("Something went wrong, please try again", "BAD REQUEST");
      }
    },
  },
  Subscription: {
    recipes:  {
      subscribe: withFilter(
        () => pubsub.asyncIterator(['RECIPE']),
        (payload, variables, context) => {
          let user = context.user;
          if (user === 'anonymous') {
            return payload.recipes.data.accessibility === 'PUBLIC'
          } else {
            return (payload.recipes.data.accessibility === 'PUBLIC' || payload.recipeAdded.created_by == context.user.user_id);
          }
        }
      )
    }
  }
};

module.exports = {
  typeDefs: typeDefs,
  resolvers: resolvers,
  middleware: recipeMiddleware
};