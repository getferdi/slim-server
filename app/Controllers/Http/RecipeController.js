'use strict'
/**
 * Controller for the usage of recipes
 */

const Recipe = use('App/Models/Recipe');
const Env = use('Env')
const {
  validateAll,
} = use('Validator');
const Drive = use('Drive')

const fetch = require('node-fetch')

class RecipeController {
  // Search official and custom recipes
  async search({
    request,
    response,
  }) {
    // Validate user input
    const validation = await validateAll(request.all(), {
      needle: 'required',
    });
    if (validation.fails()) {
      return response.status(400).send({
        message: 'Please provide a needle',
        messages: validation.messages(),
        status: 400,
      });
    }

    const needle = request.input('needle');

    // Get results
    let results;

    if (needle === 'ferdi:custom') {
      // List all custom recipes
      const dbResults = (await Recipe.query().where('isPublic', true).fetch()).toJSON();
      results = dbResults.map((recipe) => ({
        id: recipe.recipeId,
        name: recipe.name,
        ...JSON.parse(recipe.data),
      }));
    } else {
      const remoteResults = JSON.parse(await (await fetch(`${Env.get('FRANZ_SERVER')}/v1/recipes/search?needle=${encodeURIComponent(needle)}`)).text());
      const localResultsArray = (await Recipe.query().where('name', 'LIKE', `%${needle}%`).where('isPublic', true).fetch()).toJSON();
      const localResults = localResultsArray.map((recipe) => ({
        id: recipe.recipeId,
        name: recipe.name,
        ...JSON.parse(recipe.data),
      }));

      results = [
        ...localResults,
        ...remoteResults || [],
      ];
    }

    return response.send(results);
  }

  // Download a recipe
  async download({
    response,
    params,
  }) {
    // Validate user input
    const validation = await validateAll(params, {
      recipe: 'required|accepted',
    });
    if (validation.fails()) {
      return response.status(401).send({
        message: 'Please provide a recipe ID',
        messages: validation.messages(),
        status: 401,
      });
    }

    const service = params.recipe;

    // Check for invalid characters
    if (/\.{1,}/.test(service) || /\/{1,}/.test(service)) {
      return response.send('Invalid recipe name');
    }

    // Check if recipe exists in recipes folder
    if (await Drive.exists(`${service}.tar.gz`)) {
      return response.send(await Drive.get(`${service}.tar.gz`));
    }
    return response.redirect(`${Env.get('FRANZ_SERVER')}/v1/recipes/download/${service}`);
  }
}

module.exports = RecipeController
