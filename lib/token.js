'use strict';

var jwt = require('jwt-simple');


/**
 * The secret that will be used to encode / decode tokens.
 */
var tokenSecret = 'igottasecret';


/**
 * Simply decodes a token into user data using.
 */
exports.decode = function(token, callback){
	try{
	  var data = jwt.decode(token, tokenSecret);
	  callback(null, data);
	}
	catch(e){
		// TODO: Fix this lousy error.
		console.log('auth.js line ~33 decodeToken error: ~~~~~~~\n' + e);
		callback(e);
	}
};

/**
 * Pass in a mongoose user document and get back a token with the user data..
 */
exports.generate = function(user){
	// Setup the data.
	user = user.toObject();

	user.timestamp = new Date().getTime();
  delete user.password;

  // Create the token
  user.token = jwt.encode(user, tokenSecret);
  return user;
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
				User.findOne({email:data.email}, function(err, user){
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