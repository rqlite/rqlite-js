# rqlite-js &middot; [![npm version](https://img.shields.io/npm/v/rqlite-js.svg?style=flat)](https://www.npmjs.com/package/rqlite-js) &middot; [![Build Status](https://travis-ci.org/rqlite/rqlite-js.svg?branch=master)](https://travis-ci.org/rqlite/rqlite-js) &middot; [![Google Group](https://img.shields.io/badge/Google%20Group--blue.svg)](https://groups.google.com/group/rqlite)
A promise based client library for [rqlite](https://github.com/rqlite/rqlite), the lightweight, distributed database built on SQLite.  This package is designed to provide javascript classes with interfaces that line up with RQLite API endpoints.  Please note that there is no code in this package for writing SQL queries.  There are other Javascript SQL generator libraries such as [sequel](https://www.npmjs.com/package/sequel) which can be used to create the SQLite query strings.  You are welcome to use one of those libraries or write your own SQL queries directly in your code.

## Features
* Automatically follow 301 redirects from replicates to leader node
* Round robin of Query statements across leader and all replicates for query api requests
* HTTP Keepalive provided by forever agent as implemented by the [request](https://www.npmjs.com/package/request) and [request-promise](https://www.npmjs.com/package/request-promise) libraries

## DataApiClient
The data API client will allow you to access the [data API endpoints](https://github.com/rqlite/rqlite/blob/master/DOC/DATA_API.md) of RQLite such as `query` and `execute`.  All data methods will return a DataResults instance which is an array of DataResult instances.  The DataResult instances are designed to abstract working with the response body from RQLite data endpoints.  If you want to work with the raw HTTP response instead of using the DataResults the options accept a raw options which can be set to true.  This is covered in the examples below.

### DataApiClient Methods
The follow methods are available on the DataApiClient including their method signatures.  Both the query and execute methods return a DataResults instance which provides methods for handling the RQLite response body states. In the case of a query there will only ever be one result in the DataResults.

* DataApiClient.query(sql, options) - Single query SQL statments sent via HTTP get (Note, if you pass an array it will call execute internally)
* DataApiClient.execute(sql, options) - Multiple SQL statments

## DATA API Usage

### CREATE TABLE Example
The code sample shows how you would connect to a rqlite server and create a table.

```javascript
import { DataApiClient } from 'rqlite-js'

const dataApiClient = new DataApiClient('http://localhost:4001')
try {
  // You can create your own raw SQL query or use another SQL generator library of your liking.
  const sql = 'CREATE TABLE foo (id integer not null primary key, name text)'
  const dataResults = await dataApiClient.execute(sql)
  // Check the results for an error to make sure we the SQL query did
  // not generate an error while executing.
  if (dataResults.hasError()) {
    const error = dataResults.getFirstError()
    console.error(error, 'rqlite create tables results contained an error.')
    return
  }
  // We are successful and have results to use from our SQL query.
  console.log(dataResults.toString(), 'Checkout the rqlite results as a JSON string.')
  console.log(dataResults.toArray(), 'Checkout the rqlite results as plain javascript array for app use.')
  console.log(dataResults.get(0).toString(), 'Checkout just the first rqlite result as a JSON string.')

  // Lets get the same query as a raw HTTP response
  const { statusCode, body } = await dataApiClient.execute(sql, { raw: true })
  console.log(body, 'HTTP reponse body.')
  console.log(statusCode, 'HTTP response code.')
} catch (e) {
  console.error(e, 'The HTTP client got an HTTP error, there must be something else going on.')
}
```

### Multiple QUERY Example
The code sample shows how would connect to a rqlite server insert a row then select the row.

```javascript
import { DataApiClient } from 'rqlite-js'

const dataApiClient = new DataApiClient('http://localhost:4001')
try {
  // Insert a row into the table foo we create above in the CREATE TABLE example.
  // The values for sql can be a string or an array if you want to execute multiple
  // SQL queries on the server.
  let dataResults = await dataApiClient.execute('INSERT INTO foo(name) VALUES(\"fiona\")')
  if (dataResults.hasError()) {
    const error = dataResults.getFirstError()
    console.error(error, 'rqlite insert results contained an error.')
    return
  }
  const id = dataResults.get(0).getLastInsertId()
  console.log(id, 'The id of the inserted row')
  dataResults = await dataApiClient.query(`SELECT name FROM foo WHERE id="${id}"`)
  if (dataResults.hasError()) {
    const error = dataResults.getFirstError()
    console.error(error, 'rqlite select results contained an error.')
    return
  }
  console.log(dataResults.get(0).get('name'), 'The value for the name field which should equal fiona')
  console.log(dataResults.get(0).toObject(), 'rqlitejs results are great, but I just want to work with a plain js object maybe to send back in my api')
  console.log(dataResults.get(0).get('id'), 'This is just the id of the first result.')
  dataResults = await dataApiClient.execute(`UPDATE foo SET name="justin" WHERE name="fiona"`)
  if (dataResults.hasError()) {
    const error = dataResults.getFirstError()
    console.error(error, 'rqlite select results contained an error.')
    return
  }
  const rowsAffected = dataResults.get(0).getRowsAffected()
  console.log(rowsAffected, 'The number of rows updated for each update query which should be 1 for the first row')
  dataResults = await dataApiClient.query(`SELECT name FROM foo WHERE id="${id}"`)
  if (dataResults.hasError()) {
    const error = dataResults.getFirstError()
    console.error(error, 'rqlite select results contained an error.')
    return
  }
  console.log(dataResults.get(0).get('name'), 'The value for the name field which should now equal justin')
} catch (e) {
  console.error(e, 'The HTTP client got an HTTP error, there must be something else going on.')
}
```

### Using transactions Example
The code sample shows how would connect to a rqlite and run multiple insert queries within a transaction [transactions](https://github.com/rqlite/rqlite/blob/master/DOC/DATA_API.md#transactions).

```javascript
import { DataApiClient } from 'rqlite-js'

const dataApiClient = new DataApiClient('http://localhost:4001')
try {
  // Insert a row into the table foo we create above in the CREATE TABLE example.
  // The values for sql can be a string or an array if you want to execute multiple
  // SQL queries on the server.
  const sql = [
    'INSERT INTO foo(name) VALUES(\"fiona\")',
    'INSERT INTO bar(name) VALUES(\"test\")',
  ]
  const dataResults = await dataApiClient.execute(sql, { transaction: true })
  if (dataResults.hasError()) {
    const error = dataResults.getFirstError()
    console.error(error, 'rqlite insert results contained an error.')
    return
  }
  console.log(dataResults.get(0).getLastInsertId(), 'The id for the first insert is in index 0 last_insert_id')
  console.log(dataResults.get(1).getLastInsertId(), 'The id for the second insert is in index 1 last_insert_id')
} catch (e) {
  console.error(e, 'The HTTP client got an HTTP error, there must be something else going on.')
}
```

### Multiple QUERY Example With Consistency
The code sample shows how would connect to a rqlite and run multiple select queries with [strong consistency](https://github.com/rqlite/rqlite/blob/master/DOC/CONSISTENCY.md).

```javascript
import { DataApiClient } from 'rqlite-js'

const dataApiClient = new DataApiClient('http://localhost:4001')
try {
  const sql = [
    'SELECT name FROM foo WHERE id="1"',
    'SELECT id FROM bar WHERE name="test"',
  ]
  const dataResults = await dataApiClient.query(sql, { level: 'strong' })
  if (dataResults.hasError()) {
    const error = dataResults.getFirstError()
    console.error(error, 'rqlite insert results contained an error.')
    return
  }
  console.log(dataResults.get(0).toString(), 'The results for the first select are in index 0')
  console.log(dataResults.get(1).toString(), 'The results for the second select are in index 1')
} catch (e) {
  console.error(e, 'The HTTP client got an HTTP error, there must be something else going on.')
}
```
### Authentication
Authentication can be passed either inline in the URL or via the httpOptions auth property and object of the form `{user, pass}`.

```javascript
import { DataApiClient } from 'rqlite-js'

// You can initialize the client with auth in the URL instead of using the options
const dataApiClient = new DataApiClient('http://localhost:4001')
try {
  const user = 'rqliteUsername'
  const pass = 'rqlitePassword'
  // Notice how we just added the username and password to the URL
  const sql = [
    'SELECT name FROM foo WHERE id="1"',
    'SELECT id FROM bar WHERE name="test"',
  ]
  const dataResults = await dataApiClient.query(sql, { auth: { user, pass }, level: 'strong' })
  if (dataResults.hasError()) {
    const error = dataResults.getFirstError()
    console.error(error, 'rqlite insert results contained an error.')
    return
  }
  console.log(dataResults.get(0).toString(), 'The results for the first select are in index 0')
  console.log(dataResults.get(1).toString(), 'The results for the second select are in index 1')
} catch (e) {
  console.error(e, 'The HTTP client got an HTTP error, there must be something else going on.')
}
```

### Client options
Multiple hosts can be provided using the construtor for the data api client. For greater performance when making http requests it is often useful to provide an http and https agent to the client through options.

```javascript
import { DataApiClient } from 'rqlite-js'
import http from 'http'
import https from 'https'

// Hosts can be an array or a string that is comma seperated e.g. 'http://localhost:4001,http://localhost:4002,http://localhost:4003'
const dataApiClient = new DataApiClient(['http://localhost:4001', 'http://localhost:4002', 'http://localhost:4003'], {
  httpAgent: new http.Agent({ keepAlive: true }),
  httpsAgent: new https.Agent({ keepAlive: true }),
})
```

## Testing
Please see the [docs/test/README.md](docs/test/README.md) for more information on testing for use by contributors.
