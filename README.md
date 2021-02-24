# sloshdb
Real-time in-memory key-value database inspired by redis written in Typescript

## How to install and run, stop etc

### Requirements
- Git
- Node v14 or above
- PM2, install by running `npm install --global pm2`

### Installation
```sh
$ git clone --single-branch --branch production https://github.com/xetha-bot/sloshdb.git
$ cd sloshdb
$ npm install
$ npm run build
```

### Starting
```sh
$ npm run p:start
```


### How to connect
Using [sloshdb-client](https://github.com/xetha-bot/sloshdb-client) for node.js or the browser

```sh
npm install sloshdb-client
```

```js
const SloshDB = require('sloshdb-client');
const db = new SloshDB('http://127.0.0.1:5123'); // auto connects
```

### Basic Usage
```js
const SloshDB = require('sloshdb-client');
const db = new SloshDB('http://127.0.0.1:5123'); // auto connects

const store = db.createStore('test'); // create a store

// Asynchronous
(async function(){

    await store.get('test'); // returns the value or null if not exist
    await store.set('test', 1234); // returns an array eg. [key, value]
    await store.has('test'); // returns true or false
    await store.delete('test'); // returns true or false

}());

```

# Important Notes
- This is very new project
- Not very secured, but ready for production (If the database is on closed ports)
- All of the data is in-memory cached so if the server restarts the all of the data is gone

# Todo
- store data in a database so it can be either in-memory or in-disk

# Contributions 
Small or Big Contributions are welcomed!

# License
See [LICENSE](LICENSE)