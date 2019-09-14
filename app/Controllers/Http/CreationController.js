'use strict'
/**
 * Controller for the creation of new recipes
 */

const Recipe = use('App/Models/Recipe');
const {
  validateAll,
} = use('Validator');
const Helpers = use('Helpers');

const targz = require('targz');
const path = require('path');
const fs = require('fs-extra');
const fetch = require('node-fetch');
const gh = require('parse-github-url');

// Compress src directory into dest file
const compress = (src, dest) => new Promise((resolve, reject) => {
  targz.compress({
    src,
    dest,
  }, (err) => {
    if (err) {
      reject(err);
    } else {
      resolve(dest);
    }
  });
});

// Download URL directly to file
const downloadFile = (async (url, path) => {
  const res = await fetch(url);
  const fileStream = fs.createWriteStream(path);
  await new Promise((resolve, reject) => {
      res.body.pipe(fileStream);
      res.body.on("error", (err) => {
        reject(err);
      });
      fileStream.on("finish", function() {
        resolve();
      });
    });
});

class CreationController {
  // Create a new recipe using the new.html page
  async create({
    request,
    response,
    session,
  }) {
    // Validate user input
    const validation = await validateAll(request.all(), {
      name: 'required|string',
      id: 'required|unique:recipes,recipeId',
      author: 'required|accepted',
      png: 'required|url',
      svg: 'required|url',
    });
    if (validation.fails()) {
      session.withErrors(validation.messages()).flashAll();
      console.log(validation.messages())
      return response.redirect('back');
    }

    const data = request.all();

    if (!data.id) {
      return response.send('Please provide an ID');
    }

    // Check for invalid characters
    if (/\.{1,}/.test(data.id) || /\/{1,}/.test(data.id)) {
      session.withErrors({
        type: 'danger',
        message: 'Invalid recipe name. Your recipe name may not contain "." or "/"'
      }).flashAll();
      return response.redirect('back');
    }

    // Clear temporary recipe folder
    await fs.emptyDir(Helpers.tmpPath('recipe'));

    // Move uploaded files to temporary path
    const files = request.file('files');
    await files.moveAll(Helpers.tmpPath('recipe'));

    // Compress files to .tar.gz file
    const source = Helpers.tmpPath('recipe');
    const destination = path.join(Helpers.appRoot(), `/recipes/private/${data.id}.tar.gz`);

    compress(
      source,
      destination,
    );

    // Create recipe in db
    await Recipe.create({
      name: data.name,
      recipeId: data.id,
      isPublic: false,
      data: JSON.stringify({
        author: data.author,
        featured: false,
        version: '1.0.0',
        icons: {
          png: data.png,
          svg: data.svg,
        },
      }),
    });

    return response.send('Successfully created your new recipe. We will now verify your recipe before publishing it.');
  }


  // Create a new recipe from a GitHub repository
  async github({
    request,
    response,
    session,
  }) {
    // Validate user input
    const validation = await validateAll(request.all(), {
      link: 'required|url',
      png: 'required|url',
      svg: 'required|url',
    });
    if (validation.fails()) {
      session.withErrors(validation.messages()).flashAll();
      console.log(validation.messages())
      return response.redirect('back');
    }

    const data = request.all();

    // Check for invalid characters
    if (/\.{1,}/.test(data.id) || /\/{1,}/.test(data.id)) {
      session.withErrors({
        type: 'danger',
        message: 'Invalid recipe name. Your recipe name may not contain "." or "/"'
      }).flashAll();
      return response.redirect('back');
    }
    // Check if valid GitHub repository link
    if (!/^https:\/\/github\.com\/\w+\/[^\/]+\/?$/.test(data.link)) {
      session.withErrors({
        type: 'danger',
        message: 'Invalid GitHub link. Must be in the format "https://github.com/user/repo"'
      }).flashAll();
      return response.redirect('back');
    }

    const { repo } = gh(data.link);

    if (!repo) {
      session.withErrors({
        type: 'danger',
        message: 'Invalid GitHub link. Must be in the format "https://github.com/user/repo"'
      }).flashAll();
      return response.redirect('back');
    }

    // Get package.json for recipe from GitHub
    const packageURL = `https://raw.githubusercontent.com/${repo}/master/package.json`;
    const recipe = await (await fetch(packageURL)).json();

    if (!recipe || !recipe.id) {
      session.withErrors({
        type: 'danger',
        message: 'Invalid GitHub link. Your repository must contain a valid package.json file'
      }).flashAll();
      return response.redirect('back');
    }

    // Validate recipe data
    const recipeValidation = await validateAll(recipe, {
      name: 'required|string',
      id: 'required|unique:recipes,recipeId',
      author: 'required|accepted',
      version: 'required',
    });
    if (recipeValidation.fails()) {
      session.withErrors(recipeValidation.messages()).flashAll();
      console.log(recipeValidation.messages())
      return response.redirect('back');
    }

    // Download recipe tarball
    const destination = path.join(Helpers.appRoot(), `/recipes/private/${recipe.id}.tar.gz`);
    const download = `https://github.com/${repo}/archive/master.tar.gz`;
    await downloadFile(download, destination);

    // Create recipe in db
    await Recipe.create({
      name: recipe.name,
      recipeId: recipe.id,
      isPublic: false,
      data: JSON.stringify({
        author: recipe.author,
        featured: false,
        version: recipe.version,
        icons: {
          png: data.png,
          svg: data.svg,
        },
      }),
    });

    return response.send('Successfully created your new recipe. We will now verify your recipe before publishing it.');
  }
}

module.exports = CreationController
