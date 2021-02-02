const { introspectionFromSchema } = require('graphql');
const mongoose = require('mongoose');

module.exports = {

  // TODO: Find out what shape 'prep' and 'cook' time will be in
  // TODO: Ensure this is production ready
  calculateMealValues: async (recipeIds) => {
    let totalTime = 0;
    let totalCalories = 0;
    let timeUnits = null;
    let tags = [];
    let recipes = await mongoose.model('recipes').find(
      {recipe_id: {$in: recipeIds}}).populate('nutrition');
    
    recipes.map(recipe => {
      totalCalories += recipe.nutrition.calories;
      let prepTime = recipe.prep_time.split(' ');
      let cookTime = recipe.cook_time.split(' ');

      totalTime += new Number(prepTime[0]);
      totalTime += new Number(cookTime[0]);
      timeUnits = prepTime[1];

      recipe.tags.map(tag => {
        if (!tags.includes(tag)) {
          tags.push(tag);
        }
      });
    });

    return {
      total_time: totalTime,
      total_time_units: timeUnits,
      total_calories: totalCalories,
      tags: tags
    };
  }
}