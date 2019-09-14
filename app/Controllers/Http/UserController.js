'use strict'
/**
 * Controller for admin user manipulation and creation
 */

const Env = use('Env');
const {
    validateAll,
} = use('Validator');
const User = use('App/Models/User');

class UserController {
    async register({ request, response, auth, session }) {
        const validation = await validateAll(request.all(), {
            username: 'required|unique:users,username',
            email: 'required|email|unique:users,email',
            password: 'required',
            key: 'required',
            terms: 'required'
        });

        if (validation.fails()) {
            session.withErrors(validation.messages()).flashExcept(['password']);
            return response.redirect('back');
        }

        // Check registration key
        const key = request.input('key');
        if (key !== Env.get('REGISTRATION_KEY')) {
            session.withErrors({ type: 'danger', message: 'Invalid registration key' });
            return response.redirect('back');
        }

        const data = request.only(['username', 'email', 'password']);

        const user = await User.create(data);

        auth.login(user);

        return response.redirect('/dashboard');
    }

    async login ({ request, response, auth, session }) {
        const validation = await validateAll(request.all(), {
            identifier: 'required',
            password: 'required',
        });
        if (validation.fails()) {
            session.withErrors({ type: 'danger', message: 'Invalid username or password' }).flashExcept(['password']);
            return response.redirect('back');
        }

        let { identifier, password } = request.all()

        if (!(/\S+@\S+\.\S+/.test(identifier))) {
            // Identifier is not mail address
            let user = (await User.query().where('username', identifier).limit(1).fetch()).toJSON();
            if (!user[0] || !user[0].email) {
                session.flash({ type: 'danger', message: 'Invalid username or password' })
                return response.redirect('back');
            }
            identifier = user[0].email;
        }

        try {
            await auth.attempt(identifier, password)
        } catch(error) {
            session.flash({ type: 'danger', message: 'Invalid username or password' })
            return response.redirect('back');
        }
        return response.redirect('/dashboard');
    }
}

module.exports = UserController
