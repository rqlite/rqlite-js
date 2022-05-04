/* eslint-disable import/prefer-default-export */
/**
 * Http request errors
 * @module http-request/errors
 */

/**
 * Error when max rediret attempts have been reached
 */
export class ERROR_HTTP_REQUEST_MAX_REDIRECTS extends Error {
  constructor (...args) {
    super(...args)
    this.name = this.constructor.name
    this.code = this.constructor.name
  }
}
