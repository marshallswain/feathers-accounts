'use strict';

var jwt = require('jwt-simple');


/**
 * Simply decodes a token into user data using.
 */
exports.decode = function(token, secret, callback){
	try{
	  var data = jwt.decode(token, secret);
	  callback(null, data);
	}
	catch(e){
		// TODO: Fix this lousy error.
		console.log('auth.js line ~33 decodeToken error: ~~~~~~~\n' + e);
		callback(e);
	}
};

/**
 * Pass in a user object and get back a token with the user data..
 */
exports.generate = function(user, secret){

	// Check for mongoose document.
	if (typeof user.toObject === 'function') {
		user = user.toObject();
	}

	// Set timestamp for a more-unique token.
	user.timestamp = new Date().getTime();

	// Don't encode the password in the token.
  delete user.password;

  // Create the auth object.
  var auth = {
  	user:user,
  	token:jwt.encode(user, secret)
  };
  return auth;
};

/**
 * Middleware to set up req.feathers.user if a token is passed over REST.
 */
exports.get = function(req, res, next){
	if (req.headers.authorization) {
		exports.decodeToken(req.headers.authorization, function(err, data){
			if (err) {
				console.log(err);
			} else if (data.email) {
				this.User.findOne({email:data.email}, function(err, user){
					// Mongoose Errors
					if (err) {
						console.log(err);
						return res.json('401', err);
					// A user was found, save the password.
					} else if (user) {
						req.feathers.user = user.toObject();
						next(null, req, res);
					}
				});
			}
		});
	} else {
		next(null, req, res);
	}
};