const express = require('express');
const { ApolloServer, AuthenticationError } = require('apollo-server-express');
const { execute, subscribe } = require('graphql');
const { verifyAccessTokenGraphQL } = require('./middlewares/auth');
const { SubscriptionServer } = require('subscriptions-transport-ws');
const { createServer } = require('http');
const cluster = require('cluster');
const bodyParser = require('body-parser');
var dotenv = require('dotenv').config();
const { configure } = require('./sdks/elasticsearch');
const {sub: client} = require('./redis_client');

if(cluster.isMaster) {
  var numWorkers = require('os').cpus().length;

  console.log('Master cluster setting up ' + numWorkers + ' workers...');

  for(var i = 0; i < numWorkers; i++) {
      cluster.fork();
  }

  cluster.on('online', function(worker) {
    console.log('Worker ' + worker.process.pid + ' is online');
  });

  cluster.on('exit', function(worker, code, signal) {
      console.log('Worker ' + worker.process.pid + ' died with code: ' + code + ', and signal: ' + signal);
      console.log('Starting a new worker');
      cluster.fork();
  });
} else {
  const app = express();
  const port = 8000;
  const models = require('./models');
  const router = require('./routes');
  const { schema } = require('./graphql/index');


  app.use(bodyParser.urlencoded({extended: false}));
  app.use(bodyParser.json());

  app.use('/', router);

  const apolloServer = new ApolloServer({
      schema,
      context: ({req}) => {
        const token = req.headers.authorization || '';
        if (token === '') {
          throw new AuthenticationError("Missing authorization header");
        } else {
          try {
            let decoded = verifyAccessTokenGraphQL(token);
            return { user: decoded }
          } catch (err) {
            throw err;
          }
        }
      }
    });
    
  apolloServer.applyMiddleware({ app, path: '/graphql' });

  app.use(function(err, req, res, next){
    console.log(err.name, process.env.NODE_ENV);
    if(err.name === "ValidationError" && process.env.NODE_ENV === "production") {
        var new_err = {
            status: "failed",
            message: "Body validation failed, missing parameters."
        }
        res.status(400).json(new_err)
    }
    else {
        res.status(400).json(err);
    }
  });
  const server = createServer(app);

  server.listen(port, () => {
    new SubscriptionServer({
      execute,
      subscribe,
      schema,
      // onConnect: (connectionParams, webSocket, context) => {
      //   const token = connectionParams.Authorization || connectionParams.authorization || '';
      //   if (token === '') {
      //     return { user: "anonymous"}
      //   } else {
      //     try {
      //       let decoded = verifyAccessTokenGraphQL(token);
      //       return { user: decoded }
      //     } catch (err) {
      //       throw err;
      //     }
      //   }
      // },
      onOperation: configureDecodeTokenSocketMiddleware()
    }, {
      server: server,
      path: '/graphql',
    });
    configure();
    console.log(`App listening on port ${port}!`);
    client.on('message', (channel, message) => {
      console.log(`Received the following message from ${channel}: ${message}`);
    });
    
    const channel = 'RECIPE';
    
    client.subscribe(channel, (error, count) => {
      if (error) {
          throw new Error(error);
      }
      console.log(`Subscribed to ${count} channel. Listening for updates on the ${channel} channel.`);
    });

  });

  function configureDecodeTokenSocketMiddleware() {
    return async function decodeTokenSocketMiddleware(connectionParams, operationParams) {
      let user;
      try {
        const token = connectionParams.Authorization || connectionParams.authorization || '';
        if (token === '') {
          throw new AuthenticationError("Missing authorization header")
        } else {
          try {
            let decoded = verifyAccessTokenGraphQL(token);
            user = decoded
          } catch (err) {
            throw err;
          }
        }
      } catch(e) {
        throw e;
      }
      return {
        ...operationParams,
        context: {
          user: user,
        },
      };
    };
  }
}

// module.exports = app;