# feathers-accounts
A FeathersJS plugin for simple user signup & login.  Requires [`feathers-hooks`](https://www.npmjs.com/package/feathers-hooks)

## Getting Started

Setting up `feathers-accounts` is a three-step process.

### 1 - The User Service
`feathers-accounts` uses a regular [Feathers service](http://feathersjs.com/#toc2) to store accounts.  You can pass it any Feathers service that supports at least the `find` and `update` methods.  Here is an example of creating a `feathers-mongodb` service:

```js
var fMongo = require('feathers-mongodb');
var db = mongo.db('mongodb://localhost:27017/feathers-tuts');
var userStore = fMongo({collection:db.collection('users')});
```

### 2 - The Config Object
The config object is used to configure plugins for auth and communication.  There is currently only one plugin, the `local` plugin, which allows email/password login using tokens instead of cookies.  Also for now, `feathers-accounts` is tightly coupled with the [Mandrill email service](http://mandrill.com/), so the config object must have all of the attributes in the example below in order to work properly.  In the below example, we are passing the `userStore` that we just created, above, in as the `config.store` attribute.

```js
var config = {
    store:userStore,
    // Using the `local` plugin for token login.
    local:{
        id:'_id',
        // Make your own unique secret. Used for token generation.
        secret:'A1E7YYKDOYWs9t9Bf2JbJsatbNaplF01',
        // The Mandrill configuration.
        mandrill:{
            key:'fVyBlahBlahbFMGBlahx-A',
            from_email:'marshall@creativeideal.net',
            from_name:'Feathers Tuts',
            subaccount:'feathers-tuts',
            website:'',
            verifyURL:'/#!verify'
        }
    }
};
```

### 3 - Register the Plugin
The final step is to register the plugin with the feathers app.  Use this first line of code to turn on all of the REST routes for user signup and authentication:

```js
// Turn on REST routes for authentication.
app.configure(accounts(config))
```

This next bit will setup authentication data on new Socket.io connections that use an auth token string:

```js
// Adds the authentication data to new socket connections.
app.configure(feathers.socketio(function(io){
    accounts.socket(io);
}))
```

### 4 - Use feathers-hooks for Access Control

Here is an example server.js file to get you started:
```js
'use strict';

var feathers = require('feathers'),
  hooks = require('feathers-hooks'),
  mongo = require('mongoskin'),
  fMongo = require('feathers-mongodb'),
  bodyParser = require('body-parser'),
  accounts = require('feathers-accounts');

var db = mongo.db('mongodb://localhost:27017/feathers-tuts');
var userStore = fMongo({collection:db.collection('users')});

var config = {
    store:userStore,
    // Using the `local` plugin for token login.
    local:{
        id:'_id',
        // Make your own unique secret. Used for token generation.
        secret:'A1E7YYKDOYWs9t9Bf2JbJsatbNaplF01',
        mandrill:{
            key:'fVyBlahBlahbFMGBlahx-A',
            from_email:'marshall@creativeideal.net',
            from_name:'Feathers Tuts',
            subaccount:'feathers-tuts',
            website:'',
            verifyURL:'/#!verify'
        }
    }
};

var app = feathers()
    .use(feathers.static(__dirname + '/public'))
    .configure(feathers.rest())
    .use(bodyParser())
    // Turn on REST routes for authentication.
    .configure(accounts(config))
    // Adds the authentication data to new socket connections.
    .configure(feathers.socketio(function(io){
        accounts.socket(io);
    }))
    // Enable hooks after auth. Lets us handle auth inside hooks.
    .configure(hooks())
    .configure(feathers.errors());

// Create a todos service.
var todoStore = fMongo({collection:db.collection('todos')});



app.use('api/todos', todoStore);

// Start the server.
var port = 8080;
app.listen(port, function() {
  console.log('Feathers server listening on port ' + port);
});

```