import {describe, it} from 'mocha'
import chai from 'chai'
import chaiAsPromised from 'chai-as-promised'
import _get from 'lodash/get'
import _size from 'lodash/size'
import connect from './index'
import {getUrl} from '../../../test/integrations'
import {getError} from '../../results'
import {PATH as PATH_EXECUTE} from '../execute'
import {PATH as PATH_QUERY} from '../query'

chai.use(chaiAsPromised)
const {assert} = chai
const URL = getUrl()

async function cleanUp() {
  const api = await connect(getUrl())
  await api.table.drop('DROP TABLE IF EXISTS foo')
}

describe('api data client', () => {
  before(cleanUp)
  after(cleanUp)
  describe('Function: connect()', () => {
    it(`should call ${URL}${PATH_EXECUTE} and create table named foo`, async () => {
      const api = await connect(getUrl())
      const sql = 'CREATE TABLE foo (id integer not null primary key, name text)'
      const res = await api.table.create(sql)
      const results = _get(res, ['body', 'results'])
      const error = getError(results)
      if (error) {
        throw error
      }
      assert.equal(1, _size(results))
    })
    it(`should call ${URL}${PATH_EXECUTE} and insert a record with the name fiona`, async () => {
      const api = await connect(URL)
      const sql = 'INSERT INTO foo(name) VALUES("fiona")'
      const res = await api.insert(sql)
      const results = _get(res, ['body', 'results'])
      const error = getError(results)
      if (error) {
        throw error
      }
      assert.equal(1, _get(results, [0, 'rows_affected']))
      assert.equal(1, _get(results, [0, 'last_insert_id']))
    })
    it(`should call ${URL}${PATH_QUERY} and select a record with the name fiona`, async () => {
      const api = await connect(URL)
      const sql = 'SELECT name FROM foo WHERE name="fiona"'
      const res = await api.select(sql)
      const results = _get(res, ['body', 'results'])
      const error = getError(results)
      if (error) {
        throw error
      }
      assert.equal('fiona', _get(results, [0, 'values', 0]))
    })
    it(`should call the ${URL}${PATH_EXECUTE} and update the record with the name fiona to the name justin`, async () => {
      const api = await connect(URL)
      const sql = 'UPDATE foo SET name="justin" WHERE name="fiona"'
      const res = await api.update(sql)
      const results = _get(res, ['body', 'results'])
      const error = getError(results)
      if (error) {
        throw error
      }
      assert.equal(1, _get(results, [0, 'rows_affected']))
    })
    it(`should call the ${URL}${PATH_QUERY} and select a record with the name justin`, async () => {
      const api = await connect(URL)
      const sql = 'SELECT name FROM foo WHERE name="justin"'
      const res = await api.select(sql)
      const results = _get(res, ['body', 'results'])
      const error = getError(results)
      if (error) {
        throw error
      }
      assert.equal('justin', _get(results, [0, 'values', 0]))
    })
    it(`should call the ${URL}${PATH_EXECUTE} and delete a record with the name justin`, async () => {
      const api = await connect(URL)
      const sql = 'DELETE FROM foo WHERE name="justin"'
      const res = await api.delete(sql)
      const results = _get(res, ['body', 'results'])
      const error = getError(results)
      if (error) {
        throw error
      }
      assert.equal(1, _get(results, [0, 'rows_affected']))
    })
    it(`should call the ${URL}${PATH_QUERY} and select a count of foo item that has a result of zero`, async () => {
      const api = await connect(URL)
      const sql = 'SELECT COUNT(id) AS idCount FROM foo'
      const res = await api.select(sql)
      const results = _get(res, ['body', 'results'])
      const error = getError(results)
      if (error) {
        throw error
      }
      assert.equal(0, _get(results, [0, 'values', 0]))
    })
    it(`should call ${URL}${PATH_EXECUTE} and insert a record with the name fiona and justin using a transaction`, async () => {
      const api = await connect(URL)
      const sql = [
        'INSERT INTO foo(name) VALUES("fiona")',
        'INSERT INTO foo(name) VALUES("justin")',
      ]
      const res = await api.insert(sql, {transaction: true})
      const results = _get(res, ['body', 'results'])
      const error = getError(results)
      if (error) {
        throw error
      }
      assert.equal(1, _get(results, [0, 'rows_affected']))
      assert.equal(1, _get(results, [0, 'last_insert_id']))
    })
    it(`should call the ${URL}${PATH_QUERY} and select a count of foo items that has a result of two`, async () => {
      const api = await connect(URL)
      const sql = 'SELECT COUNT(id) AS idCount FROM foo WHERE name IN("fiona", "justin")'
      const res = await api.select(sql)
      const results = _get(res, ['body', 'results'])
      const error = getError(results)
      if (error) {
        throw error
      }
      assert.equal(2, _get(results, [0, 'values', 0]))
    })
    it(`should call the ${URL}${PATH_QUERY} and select an array of records with the name fiona then justin`, async () => {
      const api = await connect(URL)
      const sql = [
        'SELECT name FROM foo WHERE name="fiona"',
        'SELECT name FROM foo WHERE name="justin"',
      ]
      const res = await api.select(sql)
      const results = _get(res, ['body', 'results'])
      const error = getError(results)
      if (error) {
        throw error
      }
      assert.equal('fiona', _get(results, [0, 'values', 0]))
      assert.equal('justin', _get(results, [1, 'values', 0]))
    })
    it(`should call the ${URL}${PATH_EXECUTE} and drop the table foo`, async () => {
      const api = await connect(URL)
      const sql = 'DROP TABLE foo'
      const res = await api.table.drop(sql)
      const results = _get(res, ['body', 'results'])
      const error = getError(results)
      if (error) {
        throw error
      }
      assert.equal(1, _get(results, [0, 'rows_affected']))
    })
  })
})
