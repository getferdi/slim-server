# ferdi-slim-server
ferdi-slim-server is a slim alternative to [ferdi-server](https://github.com/vantezzen/ferdi-server).

Opposed to ferdi-server, ferdi-slim-server is only a wrapper around the Franz API that allows you to add custom recipes. These recipes will be availible on all clients that conntect to your ferdi-slim-server.

## Looking for a full Ferdi server?
If you want to create an independent Ferdi server, please use [ferdi-server](https://github.com/vantezzen/ferdi-server) instead of ferdi-slim-server.

## Installation
1. Clone this repository
2. Install the [AdonisJS CLI](https://adonisjs.com/)
3. Copy `.env.example` to `.env` and edit the [configuration](#configuration) to your needs
4. Run the database migrations with
    ```js
    adonis migration:run
    ```
5. Start the server with
    ```js
    adonis serve --dev
    ```

## Configuration
franz-server's configuration is saved inside the `.env` file. Besides AdonisJS's settings, ferdi-server has the following custom settings:
- `FRANZ_SERVER`: URL to Franz API server (default: `https://api.franzinfra.com`)
- `REGISTRATION_KEY`: [Key needed to register a new admin user](#creating-admin-users) (default: `ferdi`)

## Usage
### Creating admin users
Before recipes in ferdi-slim-server get published to all clients, an admin user has to verify the recipe first.

To create a new admin user, visit `/admin/register`. Please keep in mind that the "Registration Key" is defined in your `.env` file.

### Creating a new recipe
For documentation on how to create a recipe, please visit [the official guide by Franz](https://github.com/meetfranz/plugins/blob/master/docs/integration.md).

When creating a new recipe in ferdi-slim-server you'll have two options:

#### Upload a recipe directly
To upload a recipe directly, go to `/new`. Fill in all information and submit the form. The recipe can now be verified using an admin account.

#### Import your recipe from a GitHub repository
To import a GitHub repository, go to `/github`. Fill in all information and submit the form. The recipe can now be verified using an admin account.

More information on recipe creation can be found [in the ferdi-server repository](https://github.com/vantezzen/ferdi-server#creating-and-using-custom-recipes).

### Verifying recipes
After uploading a recipe, an admin user has to verify it.

To verify a recipe, log in to your admin account on `/admin/login` and visit the admin dashboard at `/admin/dashboard`. You will see a list of unverified recipes that you can verify by downloading them, then publishing them by clicking `Accept`.

## License
ferdi-slim-server is licensed under the MIT License