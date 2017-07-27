# rqlite-js &middot; [![npm version](https://img.shields.io/npm/v/rqlite-js.svg?style=flat)](https://www.npmjs.com/package/rqlite-js)
A promise based client library for [rqlite](https://github.com/rqlite/rqlite), the lightweight, distribubted database built on SQLite, that will work in the browser and in NodeJS.  This package is designed to provide a javascript interface that communicates with rqlite API endpoints.  Please note that there is no code in this package for writing SQL queries.  There are other Javascript SQL generator libraries such as [sequel](https://www.npmjs.com/package/sequel) which can be used to create the SQLite query strings.  You are welcome to use one of those libraries or write your own SQL queries directly in your code.

## DATA API
The data API will allow you to access the basic CRUD operations of rqlite such as `SELECT`, `INSERT`, `UPDATE`, `DELETE`, `CREATE TABLE` and `DROP TABLE`.  To begin using the data API methods you will first want to use the connect function in [lib/api/data/client](lib/api/data/client) which returns a promise.  When the connection is successful the promise will resolve with an data API object.

### DATA API Methods
The follow methods are available on the data API object including their function signatures.

* api.select(sql, options) - `SELECT` based SQL statments
* api.insert(sql, options) - `INSERT` based SQL statments
* api.update(sql, options) - `UPDATE` based SQL statments
* api.delete(sql, options) - `DELETE` based SQL statments
* api.table.create(sql, options) - `CREATE TABLE` based SQL statments
* api.table.drop(sql, options) - `DROP TABLE` based SQL statments

## DATA API Usage

### CREATE TABLE Example
The code sample shows how would connect to a rqlite server and create a table.

```javascript
import connect from 'rqlite-js/lib/api/data/client'
import {getError, toPlainJs} from 'rqlite-js/lib/api/results'

connect('http://localhost:4001')
  .then(function onConnect (api) {
    // You can create your own raw SQL query or use another SQL generator library of your liking.
    const sql = 'CREATE TABLE foo (id integer not null primary key, name text)'
    api.table.create(sql)
      .then(function onSuccess (res) {
        // We are given back the entire response object if anything is needed, otherwise
        // the response body has our rqlite data.
        const results = res.body.results
        // Check the results for an error to make sure we the SQL query did
        // not generate an error while executing.
        const error = getError(results)
        if (error) {
          console.error('rqlite results contained an error.', error)
          return
        }
        // We are successful and have results to use from our SQL query.
        console.log('Checkout the rqlite results.', results)
        console.log('Checkout the rqlite results as plain Js object for app use.', toPlainJs(results))
      })
      .catch(function onFailure (err) {
        console.error('The HTTP client got an HTTP error, there must be something else going on.', err)
      })
  })
  .catch(function onConnectError (err) {
    console.error('The rqlite-js connect function threw an error.', err)
  })
```

### Chained QUERY Example
The code sample shows how would connect to a rqlite server insert a row then select the row.

```javascript
import connect from 'rqlite-js/lib/api/data/client'
import {getError, toPlainJs} from 'rqlite-js/lib/api/results'

connect('http://localhost:4001')
  .then(function onConnect (api) {
    // Insert a row into the table foo we create above in the CREATE TABLE example.
    // The values for sql can be a string or an array if you want to execute multiple
    // SQL queries on the server.
    const sql = 'INSERT INTO foo(name) VALUES(\"fiona\")'
    api.insert(sql)
      .then((res) => {
        const results = res.body.results
        const error = getError(results)
        if (error) {
          console.error('rqlite results contained an error.', error)
          return
        }
        const id = results[0].last_insert_id
        const sql = `SELECT name FROM foo WHERE id="${id}"`
        api.select(sql)
          .then((res) => {
            const results = res.body.results
            const error = getError(results)
            if (error) {
              console.error('rqlite results contained an error.', error)
              return
            }
            console.log('The value for the name field which should equal fiona', results[0].values[0])
            console.log('rqlite results are great, but I just want to work with the data', toPlainJs(results))
          })
      })
  })
  .catch(function onConnectError (err) {
    console.error('The rqlite-js connect function threw an error.', err)
  })
```

### Using transactions Example
The code sample shows how would connect to a rqlite and run multiple insert queries within a transaction [strong consistency](https://github.com/rqlite/rqlite/blob/master/doc/DATA_API.md#transactions).

```javascript
import connect from 'rqlite-js/lib/api/data/client'
import {getError, toPlainJs} from 'rqlite-js/lib/api/results'

connect('http://localhost:4001')
  .then(function onConnect (api) {
    const sql = [
      'INSERT INTO foo(name) VALUES(\"fiona\")',
      'INSERT INTO bar(name) VALUES(\"test\")'
    ]
    api.insert(sql, {transaction: true})
      .then((res) => {
        const results = res.body.results
        const error = getError(results)
        if (error) {
          console.error('rqlite results contained an error.', error)
          return
        }
        const id = results[0].last_insert_id
        console.log('The id for the first insert is in index 0 last_insert_id', results[0].last_insert_id)
        console.log('The id for the second insert is in index 1 last_insert_id', results[1].last_insert_id)
      })
  })
  .catch(function onConnectError (err) {
    console.error('The rqlite-js connect function threw an error.', err)
  })
```

### Multiple QUERY Example With Consistency
The code sample shows how would connect to a rqlite and run multiple select queries with [strong consistency](https://github.com/rqlite/rqlite/blob/master/doc/CONSISTENCY.md).

```javascript
import connect from 'rqlite-js/lib/api/data/client'
import {getError, toPlainJs} from 'rqlite-js/lib/api/results'

connect('http://localhost:4001')
  .then(function onConnect (api) {
    const sql = [
      `SELECT name FROM foo WHERE id="1"`,
      `SELECT id FROM bar WHERE name="test"`
    ]
    api.select(sql, {level: 'strong'})
      .then((res) => {
        const results = res.body.results
        const error = getError(results)
        if (error) {
          console.error('rqlite results contained an error.', error)
          return
        }
        console.log('The results for the first select are in index 0', results[0])
        console.log('The results for the second select are in index 1', results[1])
      })
  })
  .catch(function onConnectError (err) {
    console.error('The rqlite-js connect function threw an error.', err)
  })
```

### Keep Alive Example
The code sample shows how would pass a default `httpOptions` to all HTTP requests for `agentkeepalive` and set a different timeout.  Keepalive is something to be used in NodeJS, on the serverside only, since it is on by default in the browsers.  This will speed up requests on the server by re-using HTTP connections. See Agent keepalive for more details [https://www.npmjs.com/package/agentkeepalive](https://www.npmjs.com/package/agentkeepalive).

```javascript
import connect from 'rqlite-js/lib/api/data/client'
import {getError, toPlainJs} from 'rqlite-js/lib/api/results'
import Agent from 'agentkeepalive'
 
const keepaliveAgent = new Agent({
  maxSockets: 100,
  maxFreeSockets: 10,
  timeout: 60000,
  freeSocketKeepAliveTimeout: 30000
})

const options = {
  url: 'http://localhost:4001',
  // httpOptions will now be applied to all HTTP requests, but can 
  // still be overridden per request inside of connect.
  httpOptions: {
    agent: keepaliveAgent,
    timeout: 60000
  }
}

connect(options)
  .then(function onConnect (api) {
    // This is the same INSERT quert from above, but now it is sent over an HTTP connection
    // that remains open for the next request.
    const sql = 'INSERT INTO foo(name) VALUES(\"fiona\")'
    api.insert(sql)
      .then((res) => {
        const results = res.body.results
        const error = getError(results)
        if (error) {
          console.error('rqlite results contained an error.', error)
          return
        }
        const id = results[0].last_insert_id
        const sql = `SELECT name FROM foo WHERE id="${id}"`
        // Override the options and turn off keepalive for just this request and change
        // the timeout to 10 seconds.
        const selectOptions = {
          httpOptions: {
            agent: undefined,
            timeout: 10000
          }
        }
        api.select(sql, selectOptions)
          .then((res) => {
            const results = res.body.results
            const error = getError(results)
            if (error) {
              console.error('rqlite results contained an error.', error)
              return
            }
            console.log('The value for the name field which should equal fiona', results[0].values[0])
            console.log('rqlite results are great, but I just want to work with the data', toPlainJs(results))
          })
      })
  })
  .catch(function onConnectError (err) {
    console.error('The rqlite-js connect function threw an error.', err)
  })
```

### Authentication
Authentication can be passed either inline in the URL or via the httpOptions auth property and object of the form `{user, pass}`.

```javascript
import connect from 'rqlite-js/lib/api/data/client'
import {getError, toPlainJs} from 'rqlite-js/lib/api/results'

const user = 'rqliteUsername'
const pass = 'rqlitePassword'
// Notice how we just added the username and password to the URL
const url = `http://${user}:${pass}@localhost:4001`

// This object is equivalent to the url above.
/*
const options = {
  url: 'http://localhost:4001',
  httpOptions: {
    auth: {user, pass}
  }
}
*/
connect(url)
  .then(function onConnect (api) {
    // You can create your own raw SQL query or use another SQL generator library of your liking.
    const sql = 'CREATE TABLE foo (id integer not null primary key, name text)'
    api.table.create(sql)
      .then(function onSuccess (res) {
        // We are given back the entire response object if anything is needed, otherwise
        // the response body has our rqlite data.
        const results = res.body.results
        // Check the results for an error to make sure we the SQL query did
        // not generate an error while executing.
        const error = getError(results)
        if (error) {
          console.error('rqlite results contained an error.', error)
          return
        }
        // We are successful and have results to use from our SQL query.
        console.log('Checkout the rqlite results.', results)
        console.log('Checkout the rqlite results as plain Js object for app use.', toPlainJs(results))
      })
      .catch(function onFailure (err) {
        console.error('The HTTP client got an HTTP error, there must be something else going on.', err)
      })
  })
  .catch(function onConnectError (err) {
    console.error('The rqlite-js connect function threw an error.', err)
  })
```

## Testing
Please see the [docs/test/README.md](docs/test/README.md) for more information.
