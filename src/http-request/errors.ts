/**
 * Http request errors
 * @module http-request/errors
 */

/**
 * Error when max redirect attempts have been reached
 */
export class ERROR_HTTP_REQUEST_MAX_REDIRECTS extends Error {
  code: string

  constructor (...args: ConstructorParameters<typeof Error>) {
    super(...args)
    this.name = this.constructor.name
    this.code = this.constructor.name
  }
}
