import {describe, it} from 'mocha'
import {assert} from 'chai'
import connect from './index'
import _get from 'lodash/get'
import {getUrl} from '../../../test/integrations'
import {getError} from '../../results'
import {PATH as PATH_EXECUTE} from '../execute'
import {PATH as PATH_QUERY} from '../query'

const URL = getUrl()

describe('api data client', function () {
  before(function (done) {
    connect(getUrl())
      .then(function (api) {
        const sql = 'DROP TABLE foo IF EXISTS'
        api.table.drop(sql).then(() => done(), done)
      })
      .catch(done)
  })
  describe('Function: api.connect()', function () {
    it(`should call ${URL}${PATH_EXECUTE} and create table named foo`, function (done) {
      connect(getUrl())
        .then(function (api) {
          const sql = 'CREATE TABLE foo (id integer not null primary key, name text)'
          api.table.create(sql)
            .then((res) => {
              const results = _get(res, ['body', 'results'])
              const error = getError(results)
              if (error) {
                done(error)
                return
              }
              assert.equal(1, _get(results, [0, 'rows_affected']))
              done()
            })
            .catch(done)
        })
        .catch(done)
    })
    it(`should call ${URL}${PATH_EXECUTE} and insert a record with the name fiona`, function (done) {
      connect(URL)
        .then(function (api) {
          const sql = 'INSERT INTO foo(name) VALUES(\"fiona\")'
          api.insert(sql)
            .then((res) => {
              const results = _get(res, ['body', 'results'])
              const error = getError(results)
              if (error) {
                done(error)
                return
              }
              assert.equal(1, _get(results, [0, 'rows_affected']))
              assert.equal(1, _get(results, [0, 'last_insert_id']))
              done()
            })
            .catch(done)
        })
        .catch(done)
    })
    it(`should call ${URL}${PATH_QUERY} and select a record with the name fiona`, function (done) {
      connect(URL)
        .then(function (api) {
          const sql = 'SELECT name FROM foo WHERE name=\"fiona\"'
          api.select(sql)
            .then((res) => {
              const results = _get(res, ['body', 'results'])
              const error = getError(results)
              if (error) {
                done(error)
                return
              }
              assert.equal('fiona', _get(results, [0, 'values', 0]))
              done()
            })
            .catch(done)
        })
        .catch(done)
    })
    it(`should call the ${URL}${PATH_EXECUTE} and update the record with the name fiona to the name fionaTest`, function (done) {
      connect(URL)
        .then(function (api) {
          const sql = 'UPDATE foo SET name=\"fionaTest\" WHERE name=\"fiona\"'
          api.update(sql)
            .then((res) => {
              const results = _get(res, ['body', 'results'])
              const error = getError(results)
              if (error) {
                done(error)
                return
              }
              assert.equal(1, _get(results, [0, 'rows_affected']))
              done()
            })
            .catch(done)
        })
        .catch(done)
    })
    it(`should call the ${URL}${PATH_QUERY} and select a record with the name fionaTest`, function (done) {
      connect(URL)
        .then(function (api) {
          const sql = 'SELECT name FROM foo WHERE name=\"fionaTest\"'
          api.select(sql)
            .then((res) => {
              const results = _get(res, ['body', 'results'])
              const error = getError(results)
              if (error) {
                done(error)
                return
              }
              assert.equal('fionaTest', _get(results, [0, 'values', 0]))
              done()
            })
            .catch(done)
        })
        .catch(done)
    })
    it(`should call the ${URL}${PATH_EXECUTE} and delete a record with the name fionaTest`, function (done) {
      connect(URL)
        .then(function (api) {
          const sql = 'DELETE FROM foo WHERE name=\"fionaTest\"'
          api.delete(sql)
            .then((res) => {
              const results = _get(res, ['body', 'results'])
              const error = getError(results)
              if (error) {
                done(error)
                return
              }
              assert.equal(1, _get(results, [0, 'rows_affected']))
              done()
            })
            .catch(done)
        })
        .catch(done)
    })
    it(`should call the ${URL}${PATH_QUERY} and select a count of foo item that has a result of zero`, function (done) {
      connect(URL)
        .then(function (api) {
          const sql = 'SELECT COUNT(id) AS idCount FROM foo'
          api.select(sql)
            .then((res) => {
              const results = _get(res, ['body', 'results'])
              const error = getError(results)
              if (error) {
                done(error)
                return
              }
              assert.equal(0, _get(results, [0, 'values', 0]))
              done()
            })
            .catch(done)
        })
        .catch(done)
    })
    it(`should call the ${URL}${PATH_EXECUTE} and drop the table foo`, function (done) {
      connect(URL)
        .then(function (api) {
          const sql = 'DROP TABLE foo'
          api.table.drop(sql)
            .then((res) => {
              const results = _get(res, ['body', 'results'])
              const error = getError(results)
              if (error) {
                done(error)
                return
              }
              assert.equal(1, _get(results, [0, 'rows_affected']))
              done()
            })
            .catch(done)
        })
        .catch(done)
    })
  })
})