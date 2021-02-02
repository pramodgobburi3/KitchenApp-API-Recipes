# KitchenApp API-Recipes
## A microservice for recipes and related functions
#### This template is a work in progress. Please make suggestions and improvements.

## Installation:
```
git clone git@github.com:SideHustlers/KitchenApp-api-recipes.git
cd KitchenApp-api-recipes
npm install
```
## Configuration:
##### This API requires two RS512 public / private key pairs to facilitate JWT Auth.
#### 1. Create a RS512 public / private key pair on a linux / mac environment:
```
mkdir keys && cd keys
ssh-keygen -t rsa -b 4096 -m PEM -f [NAME].key
# Don't add passphrase
open rsa -n [NAME].key -pubout -outform PEM -out [NAME].key.pub
```
##### At this point you should have a public and private key with the specified name in the directory.
##### :exclamation: You will need two public / private key pairs for access tokens and refresh tokens
#### 2. Initialize a new local PostgreSQL database and update `envs/env_local`
#### 3. Run migrations
```
npm run local_migrations 
# npm run dev_migrations
# npm run prod_migrations
```
## Running Server:
```
npm run local
# npm run dev
# npm run prod
```
## Requirements:
- NPM
- Dedicated Local Mongo database

## Project Components:
- index.js
- Configurations (config)
- Controllers (controllers)
- Dependencies (node_modules)
- Middlewares (middlewares)
- Migrations (migrations)
- Models (models)
- Helpers (helpers)
- Routes (routes)
- Dockerfiles, Gitlab-CI files

## Index.js
#### `index.js` is the entrypoint for the express application. It houses the application code to start a server on a specified port and to connect routes.

### Changing Port (Default 8000):
#### To change the default port change the port variable in `index.js`
`$const port = 8000`
#### :exclamation: *Make sure to change the default port to 8000 before pushing code to GitHub*

---
## Configurations :wrench:
#### All database configurations are located in `config`folder
- Local Development Configuration => `local`
- Local Testing Configuration => `local_test`
- Gitlab CI Testing Configuration => `test`
- Development Branch Configuration (Blue) => `development`
- Production / Master Branch Configuration (Green) => `production`


---

## Dependencies
#### All dependencies in this project are managed through NPM.
#### Installation:
`$ npm install`
##### * A list of all dependencies and devDependencies are available in `package.json`
---

## Middlewares 
#### Middleware functions are executed in the middle after an incoming request and before a response.
#### This application has placeholder code for auth and permissions middleware.
- Auth middleware is used to authorize a user by validating any authorization token
- Permission middleware is used to check ownership of a resource.
#### *All middlewares are located in `middlewares/`directory*
##### *[More about middlewares](https://expressjs.com/en/guide/using-middleware.html)*

---

## Models & Schemas
#### This application uses [Mongoose](https://mongoosejs.com/) to manage models and schemas.

#### *All models can be found in the `models/` directory
---
## Response Helpers 
#### Response Helpers are pre-built responses meant to reduce code redundancies and improve error handling.
##### This application has sample response helpers that output success(200), bad (400), and error(500) responses.
#### *All response helpers are located in `response_helpers/` directory*

---

## Routes & Router
#### Routes define the endpoints where requests can be made. Express Router defines all routes.
##### In this template `index.js` route file serves a hub for all routes.
#### *All routes are located in `routes/` directory*

##### *[More about Express routing](https://expressjs.com/en/guide/routing.html)*

---
## Tests
#### This projects uses [mocha](https://mochajs.org/) and [chai](https://www.chaijs.com/) frameworks for endpoint testing. All tests will run in Gitlab CI.
#### :warning: *Please ensure all tests pass locally before pushing to Gitlab CI* 
### Creating a test:
- Write your tests in `{your_test_name}.js` file
- Add your tests in main.js
`require('./{your_test_name}.js')`

### Running tests:
`$ npm test`
#### To view the logic behind the scenes for testing, please refer to `scripts` section in `package.json`

#### *All tests are located in `tests/` directory*

##### *[Article about testing](https://mherman.org/blog/testing-node-js-with-mocha-and-chai/)*

---
## Dockerfiles
#### Dockerfiles define all commands to assemble a docker image for aws deployments.
#### Docker images are automatically generated and stored during development or production phases of Gitlab CI pipelines.
#### This template contains two Dockerfiles:
- prod.Dockerfile defines a production environment image
- dev.Dockerfile defines a development environment image
#### :warning: *Please ensure all changes made to a Dockerfile are functional* 


##### *[More about Dockerfiles](https://docs.docker.com/engine/reference/builder/)*


