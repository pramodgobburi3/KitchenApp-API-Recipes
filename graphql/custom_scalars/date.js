const { GraphQLScalarType } = require('graphql');
const { Kind } = require('graphql/language');

const typeDefs = `
scalar Date

extend type Query {
  date: Date
}
`;

const resolvers = {
  Date: new GraphQLScalarType({
    name: 'Date',
    description: 'Date customer scalar type',
    parseValue(value) {
      // value from the client
      return new Date(value);
    },
    serialize(value) {
      // value sent to the client
      return value.toISOString();
    },
    parseLiteral(ast) {
      if (ast.kind === Kind.INT) {
        // ast value is always in string format
        return new Date(+ast.value)
      }
      return null;
    },
  }),
};

module.exports = {
  typeDefs: typeDefs,
  resolvers: resolvers
};