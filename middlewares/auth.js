const fs = require('fs');
const jwt = require('jsonwebtoken');
const responses = require('../helpers/responses');
const { ApolloError } = require('apollo-server-express');
const accessTokenPublicKey = fs.readFileSync('keys/jwtRS512.key.pub');

module.exports = {
  verifyAccessToken: function(requireAuth) {
    return function(req, res, next) {
      if(req.headers.authorization) {
        var authHeader = req.headers.authorization;
        var token;
        if (authHeader.startsWith("Bearer ")){
          token = authHeader.substring(7, authHeader.length);
        } else {
          return responses.returnUnauthorizedResponse(req, res, "Invalid token format, must be a Bearer token");
        }
        jwt.verify(token, accessTokenPublicKey, async function(err, decoded) {
          if (err) {
            return responses.returnUnauthorizedResponse(req, res, err);
          } else {
            try {
              if (decoded.type === 'client') {
                req.user = "anonymous";
              } else {
                req.user = decoded;
              }
              next();
            } catch (err) {
              console.log(err);
              return responses.returnBadRequest(req, res, "Something went wrong, please try again");
            }
          }
        });
      } else {
        return responses.returnUnauthorizedResponse(req, res, "Missing authorization header");
      }
    }
  },
  verifyAccessTokenGraphQL: function(authHeader) {
    var token;
    if (authHeader.startsWith("Bearer ")){
      token = authHeader.substring(7, authHeader.length);
    } else {
      throw new ApolloError("Invalid token format, must be a Bearer token", "UNAUTHORIZED", null);
    }
    try {
      let decoded = jwt.verify(token, accessTokenPublicKey);
      if (decoded.type === 'client') {
        decoded = 'anonymous';
      }
      return decoded;
    } catch (err) {
      throw new ApolloError(err.message, err.name, null);
    }
  }
}