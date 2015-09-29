var feathers = require('feathers');
var hooks = require('feathers-hooks');
var accounts = require('../lib/index');
var bodyParser = require('body-parser');

var userService = require('./services/user');

var config = {
  service: userService,
  // The endpoint belonging to the user service.
  endpoint:'api/users',
  id: '_id',
  // Make your own unique secret. Used for token generation.
  secret: 'A1Ws3tYKDOYWs9t9Bf2JbJsatbNaplF01',
  mandrill: {
    key: 'fVyiNG2DZHMbFMGxUiOx-A',
    from_email: 'marshall@creativeideal.net',
    from_name: 'Feathers Tuts',
    subaccount: 'feathers-tuts',
    website: '',
    verifyURL: '/#!verify'
  }
};

var app = feathers()
  .use(bodyParser())
  .configure(hooks())
  .configure(accounts(config))
  .use('api/users', userService);

// Start the server.
var port = 8888;
app.listen(port, function() {
  console.log('Feathers server listening on port ' + port);
});
