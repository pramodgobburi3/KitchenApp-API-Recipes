const mongoose = require('mongoose');
const { ApolloError } = require('apollo-server-express');

const listItemMiddleware = {
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
    list_items: [ListItem]
  }
  type ListItem {
    list_item_id: String!,
    recipe_ingredient_ids: [String],
    quantity: Float,
    unit: String,
    name: String,
    is_fulfilled: Boolean,
    type: String!,
    note: String,
    created_by: String!,
    updated_by: String!,
    created_at: Date!,
    updated_at: Date!
  }
`;

const resolvers = {
  Query: {
    list_items: async (parent, args, context, info) => {
      try {
        if (context.user === 'anonymous') {
          throw new ApolloError("Login Required", "UNAUTHORIZED");
        } else {
          let listItems = await mongoose.model('listitems').find({
            created_by: context.user.user_id
          }).exec();
          return listItems
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
  middleware: listItemMiddleware
};