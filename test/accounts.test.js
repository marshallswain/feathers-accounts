'use strict';

var needle = require('needle');
var assert = require('assert');
var feathers = require('feathers');
var hooks = require('feathers-hooks');
var accounts = require('feathers-accounts');
var bodyParser = require('body-parser');

// Dummy Service for Testing
var userService = {
  users:[
    {
      email:'marshall.thompson@me.com',
      password:'hi'
    }
  ],
  find: function(params, callback) {
    callback(null, this.users);
  },
  create: function(data, params, callback) {
    assert.deepEqual(data, {
      some: 'thing',
      modified: 'data'
    }, 'Data modified');

    assert.deepEqual(params, {
      modified: 'params'
    }, 'Params modified');

    callback(null, data);
  }
};

var config = {
  service:userService,
  // The endpoint belonging to the user service.
  // endpoint:'api/users',
  // Using the `local` plugin for token login.
  local:{
    id:'_id',
    // Make your own unique secret. Used for token generation.
    secret:'A1E7YYKDOYWs9t9Bf2JbJsatbNaplF01',
    mandrill:{
      key:'fVyiNG2DZHMbFMGxUiOx-A',
      from_email:'marshall@creativeideal.net',
      from_name:'Feathers Tuts',
      subaccount:'feathers-tuts',
      website:'',
      verifyURL:'/#!verify'
    }
  }
};

describe('user signup', function() {
  it('can sign up a user', function(done) {



    var app = feathers()
      .use(bodyParser())
      .configure(hooks())
      .configure(accounts(config))
      .use('/users', userService);

    // Start the server.
    var port = 8888;
    app.listen(port, function() {
      console.log('Feathers server listening on port ' + port);

      var service = app.service('/users');
      service = service;

      // AJAX Request to sign up a user.
      var data = {
        email: 'marshall@creativeideal.net',
        password: 'monkey'
      };
      var options = {
        headers: { 'X-Custom-Header': 'Bumblebee Tuna' }
      };

      needle.post('http://localhost:8888/api/signup', data, options, function(err, resp) {
        console.log(resp);
        done();
      });
    });




    // service.create({ some: 'thing' }, {}, function(error, data) {
    //   assert.ok(!error, 'No error');

    //   assert.deepEqual(data, {
    //     some: 'thing',
    //     modified: 'data'
    //   }, 'Data got modified');

    //   done();
    // });
  });

});
