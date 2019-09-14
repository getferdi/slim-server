'use strict'

/*
|--------------------------------------------------------------------------
| Routes
|--------------------------------------------------------------------------
|
| Http routes are entry points to your web application. You can create
| routes for different URL's and bind Controller actions to them.
|
| A complete guide on routing is available here.
| http://adonisjs.com/docs/4.1/routing
|
*/

/** @type {typeof import('@adonisjs/framework/src/Route/Manager')} */
const Route = use('Route')
const Env = use('Env')

// Health: Returning if all systems function correctly
Route.get('health', ({
  response,
}) => response.send({
  api: 'success',
  db: 'success',
}));

// Ferdi API
Route.group(() => {
  Route.get('recipes/search', 'RecipeController.search');
  Route.get('recipes/download/:recipe', 'RecipeController.download');

  // Redirect all other calls to Franz
  Route.any('*', ({
    request,
    response
  }) => {
    response.redirect(Env.get('FRANZ_SERVER') + request.url(), false, 307)
  })
}).prefix('v1');

// Admin Dashboard
Route.group(() => {
  // Authentification
  Route.get('login', ({
    view
  }) => {
    return view.render('auth.login');
  }).middleware('guest');
  // Login user
  Route.post('login', 'UserController.login').middleware('guest')
  // Show register form
  Route.get('register', ({
    view
  }) => {
    return view.render('auth.register');
  }).middleware('guest');
  // Register user
  Route.post('register', 'UserController.register').middleware('guest');
  // Logout user
  Route.get('logout', ({auth, response}) => {
    auth.logout();
    return response.redirect('/admin/login');
  }).middleware('guest');

  // Dashboard index
  Route.get('dashboard', 'AdminController.index').middleware('auth');

  // Recipe verification
  Route.get('download/:recipe', 'AdminController.download').middleware('auth');
  Route.get('accept/:recipe', 'AdminController.accept').middleware('auth');
  Route.get('delete/:recipe', 'AdminController.delete').middleware('auth');
}).prefix('admin').middleware('shield')

// Create new recipe
Route.post('new', 'CreationController.create');
Route.on('new').render('creation.index')
Route.post('github', 'CreationController.github');
Route.on('github').render('creation.github')

// Welcome screen
Route.on('/').render('welcome')

// Legal documents
Route.get('terms', ({
  response
}) => response.redirect('/terms.html'));
Route.get('privacy', ({
  response
}) => response.redirect('/privacy.html'));

// 404 handler
Route.get('/*', ({
  response
}) => response.redirect('/'));
