/**
 * Data api client to perform RQLite data operations such
 * as query and execute
 * @module api/data
 */
import isArray from 'lodash/isArray'
import ApiClient from '../client'

/**
 * The RQLite query api path
 */
export const PATH_QUERY = '/db/query'

/**
 * The RQLite execute api path
 */
export const PATH_EXECUTE = '/db/execute'

/**
 * Data api client to perform RQLite queries
 */
export default class DataApiClient extends ApiClient {
  /**
   * Send an RQLite query API request to the RQLite server
   * @param {String} sql The SQL string to excute on the server
   * @param {Object} [options={}] RQLite api options
   */
  async query (sql, options = {}) {
    if (isArray(sql)) {
      return super.post(PATH_QUERY, sql, options)
    }
    return super.get(PATH_QUERY, sql, options)
  }

  /**
   * Send an RQLite execute API request to the RQLite server
   * @param {String} sql The SQL string to excute on the server
   * @param {Object} [options={}] RQLite api options
   */
  async execute (sql, options = {}) {
    return super.post(PATH_EXECUTE, sql, options)
  }

  /**
   * Send a select SQL statement to the RQLite server
   * @param {String} sql The SQL string to excute on the server
   * @param {Object} [options={}] RQLite api options
   */
  async select (sql, options = {}) {
    return this.query(sql, options)
  }

  /**
   * Send an update SQL statement to the RQLite server
   * @param {String} sql The SQL string to excute on the server
   * @param {Object} [options={}] RQLite api options
   */
  async update (sql, options = {}) {
    return this.execute(sql, options)
  }

  /**
   * Send an insert SQL statement to the RQLite server
   * @param {String} sql The SQL string to excute on the server
   * @param {Object} [options={}] RQLite api options
   */
  async insert (sql, options = {}) {
    return this.execute(sql, options)
  }

  /**
   * Send a delete SQL statement to the RQLite server
   * @param {String} sql The SQL string to excute on the server
   * @param {Object} [options={}] RQLite api options
   */
  async delete (sql, options = {}) {
    return this.execute(sql, options)
  }

  /**
   * Send a create table SQL statement to the RQLite server
   * @param {String} sql The SQL string to excute on the server
   * @param {Object} [options={}] RQLite api options
   */
  async createTable (sql, options = {}) {
    return this.execute(sql, options)
  }

  /**
   * Send a drop table SQL statement to the RQLite server
   * @param {String} sql The SQL string to excute on the server
   * @param {Object} [options={}] RQLite api options
   */
  async dropTable (sql, options = {}) {
    return this.execute(sql, options)
  }
}
