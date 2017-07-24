# rqlite-js
A promise based client library for RQLite [https://github.com/rqlite/rqlite](https://github.com/rqlite/rqlite) that will work in the browser and in NodeJS.  This package is designed to provide a javascript interface the communicates with RQLite API endpoints.  Please note that these is no code in this package for writing SQL queries.  There are other javascript SQL generator libraries such as [https://www.npmjs.com/package/sequel](https://www.npmjs.com/package/sequel) which can be used to create the SQLite query strings.  You are welcome to use one of those libraries or write your own SQL queries directly in your code.

## DATA API 
The data API will allow you to access the basic CRUD operations of RQLite suchs as select, insert, update, delete, create table and drop table.  To being using the data API methods you will first want to use the connect function in [lib/api/data/client](lib/api/data/client) which returns a promise.  When the connection is successful the promise will resolve with an data api object.

### DATA API Methods
The follow methods are available on the data api object including their function signatures.

* api.select(sql, options) - SELECT based SQL statments
* api.insert(sql, options) - INSERT based SQL statments
* api.update(sql, options) - UPDATE based SQL statments
* api.delete(sql, options) - DELETE based SQL statments
* api.table.create(sql, options) - CREATE TABLE based SQL statments
* api.table.drop(sql, options) - DROP TABLE based SQL statments

## DATA API Usage

### CREATE TABLE Example
The code sample shows how would connect to a RQLite server and create a table.

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
        // the response body has our RQLite data.
        const results = res.body.results
        // Check the results for an error to make sure we the SQL query did 
        // not generate an error while executing.
        const error = getError(results)
        if (error) {
          console.error('RQLite results contained an error.', error)
          return
        }
        // We are successful and have results to use from our SQL query.
        console.log('Checkout the RQLite results.', results)
        console.log('Checkout the RQLite results as plain Js object for app use.', toPlainJs(results))
      })
      .catch(function onFailure (err) {
        console.error('The HTTP client got an HTTP error, there must be something else going on.', err)
      })
  })
  .catch(function onConnectError (err) {
    console.error('The rqlite-js connect function threw an error.', err)
  })
```

### MULTIPLE QUERY Example
The code sample shows how would connect to a RQLite server insert a row then select the row.

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
          console.error('RQLite results contained an error.', error)
          return
        }
        const id = results[0].last_insert_id
        const sql = `SELECT name FROM foo WHERE id="${id}"`
        api.select(sql)
          .then((res) => {
            const results = res.body.results
            const error = getError(results)
            if (error) {
              console.error('RQLite results contained an error.', error)
              return
            }
            console.log('This should be the value for the name field and equal fiona', results[0].values[0])
            console.log('RQLite results are great, but I just want to work with the data', toPlainJs(results))
          })
      })
  })
  .catch(function onConnectError (err) {
    console.error('The rqlite-js connect function threw an error.', err)
  })
```

### Keep Alive Example
The code sample shows how would pass a default httpOptions to all HTTP requests for agentkeepalive and set a different timeout.  Keepalive is something to be used in NodeJS, on the serverside only, since it is on by default in the browsers.  This will speed up requests on the server by re-using http connections. See Agent keepalive for more details [https://www.npmjs.com/package/agentkeepalive](https://www.npmjs.com/package/agentkeepalive).

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
  // httpOptions will now be applied to all HTTP requests, but can still be overridden per request inside of connect.
  httpOptions: {
    agent: keepaliveAgent,
    timeout: 60000
  }
}

connect(options)
  .then(function onConnect (api) {
    // This is the same INSERT quert from above, but now it is sent over an HTTP connection that remains open for the next request. 
    const sql = 'INSERT INTO foo(name) VALUES(\"fiona\")'
    api.insert(sql)
      .then((res) => {
        const results = res.body.results
        const error = getError(results)
        if (error) {
          console.error('RQLite results contained an error.', error)
          return
        }
        const id = results[0].last_insert_id
        const sql = `SELECT name FROM foo WHERE id="${id}"`
        // Override the options and turn off keepalive for just this request and change the timeout to 10 seconds.
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
              console.error('RQLite results contained an error.', error)
              return
            }
            console.log('This should be the value for the name field and equal fiona', results[0].values[0])
            console.log('RQLite results are great, but I just want to work with the data', toPlainJs(results))
          })
      })
  })
  .catch(function onConnectError (err) {
    console.error('The rqlite-js connect function threw an error.', err)
  })
```

## Testing
Please see the [docs/test/README.md](docs/test/README.md) for more information.
