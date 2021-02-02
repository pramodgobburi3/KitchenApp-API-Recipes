let elasticsearch = require('elasticsearch');

let client = new elasticsearch.Client({
  hosts: ["http://localhost:9200"]
});

let indexName = 'recipes';

let configure = () => {
  return client.indices.exists({
    index: indexName
  }).then(function (exists) {
    if (!exists) {
    console.log('Creating index %s ...', indexName)
    return client.indices.create({
      index: indexName
    }).then(function (r) {
      console.log('Index %s created:', indexName, r)
      return Promise.resolve(r)
    })
    } else {
    console.log('Index %s exists', indexName)
    return Promise.resolve()
    }
  }).catch(function (err) {
    console.log('Unable to create index index %s ...', indexName, err)
    return Promise.reject(err)
  });
};

let addRecipe = (recipe) => {
  let recipe_body = {
    name: recipe.name,
    description: recipe.description,
    tags: recipe.tags,
    accessibility: recipe.accessibility,
    created_by: recipe.created_by,
    updated_by: recipe.updated_by
  };
  console.log('recipe_body', recipe_body);
  return client.index({
    index: indexName,
    id: recipe.recipe_id,
    type: recipe.type,
    body: recipe_body
  });
}

let searchRecipe = (type, query) => {
  return client.search({
    index: indexName,
    type: type,
    body: query
  });
}

module.exports = {
  client,
  configure,
  addRecipe,
  searchRecipe
};