import { describe, it } from 'mocha'
import { assert } from 'chai'
import { Promise } from 'bluebird'
import { querySuccess, QUERY_SUCCESS_RESPONSE } from '../test/api-data-query-nock'
import { executeSuccess, EXECUTE_SUCCESS_RESPONSE } from '../test/api-data-execute-nock'
import { CONTENT_TYPE_APPLICATION_JSON } from './content-types'
import HttpRequest, { createDefaultHeaders } from './index'
import { resolve } from 'url';

const username = 'TestUsername'
const password = 'TestPassword'
const auth = {
  user: username,
  pass: password,
}

describe('http-request', () => {
  describe('Function: createDefaultHeaders()', () => {
    it(`should add the Accept header with a value of ${CONTENT_TYPE_APPLICATION_JSON}`, () => {
      assert.deepEqual({ Accept: CONTENT_TYPE_APPLICATION_JSON }, createDefaultHeaders())
    })
  })
  describe('Function: get()', () => {
    it('should perform a HTTP get request with a query', async () => {
      const url = 'http://www.rqlite.com:4001'
      const httpRequest = new HttpRequest(url)
      const path = '/test'
      const query = { test: '123' }
      const scope = querySuccess({ url, path, query })
      const res = await httpRequest.get({ path, query })
      assert.isTrue(scope.isDone(), 'http request captured by nock')
      assert.deepEqual(QUERY_SUCCESS_RESPONSE, res.body)
    })
    it('should perform a HTTP get request with basic authentication', async () => {
      const url = `http://${username}:${password}@www.rqlite.com:4001`
      const httpRequest = new HttpRequest(url)
      const path = '/test'
      const query = { test: '123' }
      const scope = querySuccess({ url, path, auth, query })
      const res = await httpRequest.get({ path, query })
      assert.isTrue(scope.isDone(), 'http request captured by nock')
      assert.deepEqual(QUERY_SUCCESS_RESPONSE, res.body)
    })
    it('should perform a HTTP get request with a query when the stream option is true', async () => {
      const url = 'http://www.rqlite.com:4001'
      const httpRequest = new HttpRequest(url)
      const path = '/test'
      const query = { test: '123' }
      const scope = querySuccess({ url, path, query })
      await new Promise(async (resolve, reject) => {
        const request = await httpRequest.get({ path, query, stream: true })
        request
          .on('data', (data) => {
            const json = JSON.parse(data.toString())
            assert.isTrue(scope.isDone(), 'http request captured by nock')
            assert.deepEqual(json, QUERY_SUCCESS_RESPONSE)
          })
          .on('end', resolve)
          .on('error', reject)
      })
    })
    it('should perform a HTTP get request with basic authentication when the stream option is true', async () => {
      const url = `http://${username}:${password}@www.rqlite.com:4001`
      const httpRequest = new HttpRequest(url)
      const path = '/test'
      const query = { test: '123' }
      const scope = querySuccess({ url, path, auth, query })
      await new Promise(async (resolve, reject) => {
        const request = await httpRequest.get({ path, query, stream: true })
        request
          .on('data', (data) => {
            const json = JSON.parse(data.toString())
            assert.isTrue(scope.isDone(), 'http request captured by nock')
            assert.deepEqual(json, QUERY_SUCCESS_RESPONSE)
          })
          .on('end', resolve)
          .on('error', reject)
      })
    })
  })
  describe('Function: post()', () => {
    it(`should make a HTTP post request and send a ${CONTENT_TYPE_APPLICATION_JSON} body`, async () => {
      const url = 'http://www.rqlite.com:4001'
      const httpRequest = new HttpRequest(url)
      const path = '/test'
      const body = ['INSERT INTO foo(name) VALUES("fiona")']
      const scope = executeSuccess({ url, path })
      const res = await httpRequest.post({ path, body })
      assert.isTrue(scope.isDone(), 'http request captured by nock')
      assert.deepEqual(res.body, EXECUTE_SUCCESS_RESPONSE)
    })
    it(`should make a HTTP post request and send a ${CONTENT_TYPE_APPLICATION_JSON} body with basic auth`, async () => {
      const url = 'http://www.rqlite.com:4001'
      const httpRequest = new HttpRequest(url)
      const path = '/test'
      const body = ['INSERT INTO foo(name) VALUES("fiona")']
      const scope = executeSuccess({ url, path, auth })      
      const res = await httpRequest.post({ path, body, auth })
      assert.isTrue(scope.isDone(), 'http request captured by nock')
      assert.deepEqual(res.body, EXECUTE_SUCCESS_RESPONSE)
    })
    it(`should make a HTTP post request and send a ${CONTENT_TYPE_APPLICATION_JSON} body when the stream option is true`, async () => {
      const url = 'http://www.rqlite.com:4001'
      const httpRequest = new HttpRequest(url)
      const path = '/test'
      const body = ['INSERT INTO foo(name) VALUES("fiona")']
      const scope = executeSuccess({ url, path })
      await new Promise(async (resolve, reject) => {
        const request = await httpRequest.post({ path, body, stream: true })
        request
          .on('data', (data) => {
            const json = JSON.parse(data.toString())
            assert.isTrue(scope.isDone(), 'http request captured by nock')
            assert.deepEqual(json, EXECUTE_SUCCESS_RESPONSE)
          })
          .on('end', resolve)
          .on('error', reject)
      })
    })
    it(`should make a HTTP post request and send a ${CONTENT_TYPE_APPLICATION_JSON} body with basic auth when the stream option is true`, async () => {
      const url = 'http://www.rqlite.com:4001'
      const httpRequest = new HttpRequest(url)
      const path = '/test'
      const body = ['INSERT INTO foo(name) VALUES("fiona")']
      const scope = executeSuccess({ url, path, auth })      
      await new Promise(async (resolve, reject) => {
        const request = await httpRequest.post({ path, body, auth, stream: true })
        request
          .on('data', (data) => {
            const json = JSON.parse(data.toString())
            assert.isTrue(scope.isDone(), 'http request captured by nock')
            assert.deepEqual(json, EXECUTE_SUCCESS_RESPONSE)
          })
          .on('end', resolve)
          .on('error', reject)
      })
    })
  })
})
