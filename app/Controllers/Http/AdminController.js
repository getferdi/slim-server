'use strict'
/**
 * Controller for the admin dashboard
 */

const Recipe = use('App/Models/Recipe');
const {
  validateAll,
} = use('Validator');
const Drive = use('Drive')
const Helpers = use('Helpers')

const path = require('path');

class AdminController {
  // List of recipes that need to be verified
  async index({
    view,
  }) {
    // Get private recipes
    const recipes = (await Recipe.query().where('isPublic', false).fetch()).toJSON();

    return view.render('admin.index', {
      recipes,
    });
  }

  // Download as admin: Also download private packages
  async download({
    response,
    params
  }) {
    // Validate user input
    const validation = await validateAll(params, {
      recipe: 'required|accepted',
    });
    if (validation.fails()) {
      return response.send({
        message: 'Please provide a recipe ID',
        messages: validation.messages(),
      });
    }

    const service = params.recipe;

    // Check for invalid characters
    if (/\.{1,}/.test(service) || /\/{1,}/.test(service)) {
      return response.send('Invalid recipe name');
    }

    // Check if recipe exists in recipes folder
    if (await Drive.exists(`${service}.tar.gz`)) {
      return response.attachment(
        path.join(Helpers.appRoot(), 'recipes', `${service}.tar.gz`),
        `${service}.tar.gz`
      );

    // Check if recipe exists in private recipe folder
    } else if (await Drive.exists(`private/${service}.tar.gz`)) {
      return response.attachment(
        path.join(Helpers.appRoot(), 'recipes', 'private', `${service}.tar.gz`),
        `${service}.tar.gz`
      );
    }
    return response.status(404).send('Recipe not found');
  }

  // Accept/validate a new recipe
  async accept({
    response,
    params,
    session,
  }) {
    // Validate user input
    const validation = await validateAll(params, {
      recipe: 'required|accepted',
    });
    if (validation.fails()) {
      return response.send({
        message: 'Please provide a recipe ID',
        messages: validation.messages()
      });
    }

    const service = params.recipe;

    // Check if recipe file exists
    if (await Drive.exists(`private/${service}.tar.gz`)) {
      // Publish recipe
        await Recipe.query().where('recipeId', params.recipe).update({'isPublic': true});
        await Drive.move(`private/${service}.tar.gz`, `${service}.tar.gz`);
    } else {
      session.withErrors({ type: 'error', message: 'Recipe not found' });
      return response.redirect('back');
    }
    session.withErrors({ type: 'success', message: 'Recipe published successfully' });
    return response.redirect('back');
  }

  // Delete/not validate a new recipe
  async delete({
    response,
    params,
    session,
  }) {
    // Validate user input
    const validation = await validateAll(params, {
      recipe: 'required|accepted',
    });
    if (validation.fails()) {
      return response.send({
        message: 'Please provide a recipe ID',
        messages: validation.messages()
      });
    }

    const service = params.recipe;

    // Check if recipe file exists
    if (await Drive.exists(`private/${service}.tar.gz`)) {
      // Delete recipe
      await Recipe.query().where('recipeId', params.recipe).delete();
      await Drive.delete(`private/${service}.tar.gz`);
    } else {
      session.withErrors({ type: 'error', message: 'Recipe not found' });
      return response.redirect('back');
    }
    session.withErrors({ type: 'success', message: 'Recipe deleted successfully' });
    return response.redirect('back');
  }
}

module.exports = AdminController
