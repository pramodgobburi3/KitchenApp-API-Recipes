const mongoose = require('mongoose');
const convert = require('convert-units');
const unitsHelper = require('../helpers/units');
const { DateTime } = require('luxon');

function combineListItems(a, b, userId) {
  let ids = [];
  ids.push(...a.recipe_ingredient_ids);
  ids.push(...b.recipe_ingredient_ids)
  return {
    recipe_ingredient_ids: ids,
    quantity: a.quantity + b.quantity,
    unit: a.unit,
    name: a.name,
    type: 'generated',
    note: a.note,
    created_by: userId,
    updated_by: userId
  };
};

module.exports = {
  aggregateGroceryListItems: async (groceryList, userId) => {
    let meals = await mongoose.model('meals').find({
      user_id: userId,
      _id: {$in: groceryList.meals}
    }).populate({
      path: 'recipes',
      populate: {
        path: 'ingredients'
      }
    });
  
    let ingredients = [];
    await Promise.all(meals.map(async meal => {
      await Promise.all(meal.recipes.map(async recipe => {
        await Promise.all(recipe.ingredients.map(ingredient => {
          ingredients.push({
            recipe_ingredient_ids: ingredient.ingredient_id,
            quantity: ingredient.min_quantity,
            unit: ingredient.unit,
            name: ingredient.name,
            note: ingredient.raw
          });
        }));
      }));
    }));
  
    let listItems = [];
    ingredients.map(ingredient => {
      listItems.push({
        recipe_ingredient_ids: [ ingredient.recipe_ingredient_ids ],
        quantity: ingredient.min_quantity,
        unit: ingredient.unit,
        name: ingredient.name,
        type: 'generated',
        note: ingredient.note,
        created_by: userId,
        updated_by: userId
      });
    });
  
    return {meals: meals, list_items: listItems};
  },

  aggregateGroceryListItemsByDate: async (startDate, endDate, userId) => {
    let meals = await mongoose.model('meals').find(
      { user_id: userId,
        date: { $gte: startDate, $lte: endDate  }
      }).populate({
        path: 'recipes',
        populate: {
          path: 'ingredients'
        }
      });
    
    let listIngredients = [];
    await Promise.all(meals.map( async meal => {
      await Promise.all(meal.recipes.map( async recipe => {
        await Promise.all(recipe.ingredients.map(ingredient => {
          listIngredients.push({
            recipe_ingredient_id: ingredient.ingredient_id,
            quantity: ingredient.min_quantity,
            unit: ingredient.unit,
            name: ingredient.name,
            note: ingredient.raw
          });
        }));
      }));
    }));

    let listItems = [];
    listIngredients.map(ingredient => {
      listItems.push({
        recipe_ingredient_ids: [ ingredient.recipe_ingredient_id ],
        name: ingredient.name,
        quantity: ingredient.quantity,
        unit: ingredient.unit,
        type: 'generated',
        note: ingredient.note,
        created_by: userId,
        updated_by: userId
      });
    });

    return {meals: meals, list_items: listItems};
  },
  
  consolidateListItems: (meals, listItems, userId) => {
    let items = [];
    let itemNames = [];
  
    listItems.map(itemA => {
      listItems.map(itemB => {
        let item = null;
        let itemName = null;
        if (itemA != itemB && !itemNames.includes(itemB.name)) {
          if (itemA.name === itemB.name) {
            if (itemA.unit === itemB.unit) {
              item = combineListItems(itemA, itemB, userId);
              itemName = item.name;
            }
            else {
              if (unitsHelper[itemA.unit] && unitsHelper[itemB.unit]) {
                // TODO: Make more robust, for better unit conversion
                let cQuantity = convert(itemA.quantity).from(unitsHelper[itemA.unit]).to(unitsHelper[itemB.unit]);
                itemA.unit = itemB.unit;
                itemA.quantity = cQuantity;
                item = combineListItems(itemA, itemB, userId);
                itemName = item.name;
              } else {
                item = itemB;
                itemName = itemB.name;
              }
            }

            if (itemNames.includes(itemName)) {
              let i = itemNames.indexOf(itemName);
              let tempItem = items[i];
              if (unitsHelper[tempItem.unit] != null && unitsHelper[tempItem.unit]) {
                item.quantity = convert(item.quantity).from(unitsHelper[item.unit]).to(unitsHelper[tempItem.unit]);
                item.unit = tempItem.unit;
                item = combineListItems(tempItem, item, userId);
                items[i] = item;
              } else {
                items.push(item);
                itemNames.push(itemName);
              }
            } else {
              items.push(item);
              itemNames.push(itemName);
            }

          }
          else if ((itemA.name != itemB.name) && meals.length == 1) {
            item = itemB;
            itemName = item.name;
            
            if (itemNames.includes(itemName)) {
              let i = itemNames.indexOf(itemName);
              let tempItem = items[i];
              if (unitsHelper[tempItem.unit] != null && unitsHelper[tempItem.unit]) {
                item.quantity = convert(item.quantity).from(unitsHelper[item.unit]).to(unitsHelper[tempItem.unit]);
                item.unit = tempItem.unit;
                item = combineListItems(tempItem, item, userId);
                items[i] = item;
              } else {
                items.push(item);
                itemNames.push(itemName);
              }
            } else {
              items.push(item);
              itemNames.push(itemName);
            }
          }

        }
      });
    });

    return items;
  },
  
  findAndRemoveMealFromGroceryList: async (meal) => {
    let mealAggregate = await mongoose.model('meals').aggregate([
      {$match: {_id: meal._id}},
      {$lookup: {
        from: 'grocerylists',
        localField: '_id',
        foreignField: 'meals',
        as: 'grocery_lists'
      }}
    ]);
    
    let groceryList = mealAggregate[0].grocery_lists[0];
    if (groceryList != null) {
      groceryList.meals.splice(groceryList.meals.indexOf(meal._id), 1);
      let mealIds = groceryList.meals;
    
      groceryList = await mongoose.model('grocerylists').findOneAndUpdate(
        {_id: groceryList._id}, {meals: mealIds}, {new: true});
    }

      
    return groceryList;
  },
  
  deleteGeneratedListItems: async (groceryList, userId) => {
    await mongoose.model('listitems').deleteMany({
      _id: {$in: groceryList.items},
      type: 'generate',
      created_by: userId
    });
  },
  
  fetchCustomListItems: async (groceryList, userId) => {
    let customItems = await mongoose.model('listitems').find({
      _id: {$in: groceryList.items},
      type: {$ne: 'generated'},
      created_by: userId
    });
  
    console.log("cust_items", customItems.length);
    return customItems;
  },

  generateGroceryListName: (startDate, endDate) => {
    let start = DateTime.fromJSDate(startDate).toFormat('MMM dd');
    let end = DateTime.fromJSDate(endDate).toFormat('MMM dd');
    let name = start + ' - ' + end;
    return name;
  }
}