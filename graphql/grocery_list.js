const mongoose = require('mongoose');
const { ApolloError } = require('apollo-server-express');

const groceryListMiddleware = {
  Query: {
    grocery_lists: async (resolve, parent, args, context, info) => {
      // You can use middleware to override arguments
      console.log(context);
      let resp = await resolve(parent, args, context, info);
      return resp;
    },
  },
};

const typeDefs = `
    extend type Query { 
      grocery_lists: [GroceryList]
    }
    type GroceryList {
      grocery_list_id: String!,
      name: String!,
      start_date: Date,
      end_date: Date,
      type: String!,
      items: [ListItem],
      meals: [Meal],
      created_by: String!,
      updated_by: String!,
      created_at: Date!,
      updated_at: Date!
    }
`;

const resolvers = {
  Query: {
    grocery_lists: async (parent, args, context, info) => {
      try {
        if (context.user === 'anonymous') {
          throw new ApolloError("Login Required", "UNAUTHORIZED");
        } else {
          let lists = await mongoose.model('grocerylists').find({
            created_by: context.user.user_id
          }).populate({
            path: 'items'
          }).populate({
            path: 'meals',
            populate: {
              path: 'recipes'
            }
          });
          return lists;
        }
      } catch (err) {
        console.log(err);
        throw new ApolloError("Something went wrong, please try again", "BAD REQUEST");
      }
    },
  }
};

module.exports = {
  typeDefs: typeDefs,
  resolvers: resolvers,
  middleware: groceryListMiddleware
};