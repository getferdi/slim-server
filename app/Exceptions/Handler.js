'use strict'

const BaseExceptionHandler = use('BaseExceptionHandler')

/**
 * This class handles all exceptions thrown during
 * the HTTP request lifecycle.
 *
 * @class ExceptionHandler
 */
class ExceptionHandler extends BaseExceptionHandler {
  /**
   * Handle exception thrown during the HTTP lifecycle
   *
   * @method handle
   *
   * @param  {Object} error
   * @param  {Object} options.request
   * @param  {Object} options.response
   *
   * @return {void}
   */
  async handle (error, { response }) {
    if (error.name === 'InvalidSessionException') {
      return response.status(401).redirect('/admin/login');
    } else if (error.code === 'E_GUEST_ONLY') {
      return response.status(401).redirect('/admin/dashboard');
    }

    console.log('New error', error.name, error.message);
    response.status(error.status).send(`There was an error while trying to perform your request(${error.name}.${error.code})`)
  }
}

module.exports = ExceptionHandler
