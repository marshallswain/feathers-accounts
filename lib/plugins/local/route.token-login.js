'use strict';

var token = require('./token');

module.exports = function(app, config) {

  app.post('/api/token-login', function(req, res) {
    // If there's no token, send error.
    if (!req.body.token) {
      res.json({
        status: 'no token',
        message: 'token is required for token login.'
      });

    // If there's a token, decode it.
    } else {
      token.decode(req.body.token, config.local.secret, function(err, data) {
        // If there was an error decoding the token.
        if (err) {
          return res.json({
          	error: 'token error',
            message: 'Could not decode token. Please login.'
          });

        // If the token didn't contain any user data...
        } else if (!data.email) {
          return res.json({
          	error: 'invalid token',
            message: 'That token was corrupt. Please login to receive a new one.'
          });

        // If the decode was successful...
        } else {
          // Get the user from the db.
          config.store.find({
            query: {
              email: data.email
            }
          }, function(err, users) {
            if (err) {return res.status(500).json(err); }

            // If a user was found,
            if (users[0]) {
              // send back auth object.
              var auth = {
                user: users[0],
                token: req.body.token
              };
              return res.json(auth);

            // No user was found
            } else {
              return res.json({
              	error: 'user not found',
                message: 'That user was not found. Please try logging in again.'
              });
            }
          });
        }
      });
    }
  });
};