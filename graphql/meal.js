const mongoose = require('mongoose');
const { ApolloError } = require('apollo-server-express');


const mealMiddleware = {
  Query: {
    meals: async (resolve, parent, args, context, info) => {
      console.log(context);
      let resp = await resolve(parent, args, context, info);
      return resp;
    },
  },
};

const typeDefs = `
  extend type Query {
    meals: [Meal]
    meal(id: String!): Meal 
  }
  type Meal {
  meal_id: String!,
  user_id: String!,
  date: Date,
  tags: [String],
  name: String,
  total_calories: Float,
  total_time: Float,
  total_time_units: String,
  recipes: [Recipe],
  created_by: String!,
  updated_by: String!,
  created_at: Date!,
  updated_at: Date!
  }
`;

const resolvers = {
  Query: {
    meals: async (parent, args, context, info) => {
      try {
        if (context.user === 'anonymous') {
          throw new ApolloError("Login Required", "UNAUTHORIZED");
        } else {
          let meals = await mongoose.model('meals').find({
            created_by: context.user.user_id
          }).populate('recipes').exec();
          return meals;
        }
      } catch(err) {
        console.log(err);
        throw new ApolloError("Something went wrong, please try again", "BAD REQUEST");
      }
    },
    meal: async (part, args, context, info) => {
      try {
        if (context.user === 'anonymous') {
          throw new ApolloError("Login Required", "UNAUTHORIZED");
        } else {
          let meal = await mongoose.model('meals').findOne({
            meal_id: args.id,
            created_by: context.user.user_id,
          }).populate({
            path: 'recipes',
            populate: { 
              path: 'ingredients media steps nutrition'
            }
          }).exec();
          return meal;
        }
      } catch (error) {
        console.log(error);
        throw new ApolloError("Something went wrong, please try again", "BAD REQUEST");
      }
    }
  }
};

module.exports = {
  typeDefs: typeDefs,
  resolvers: resolvers,
  middleware: mealMiddleware
};