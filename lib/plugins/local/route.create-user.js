'use strict';

var bcrypt = require('bcrypt'),
	token = require('./token'),
  SALT_WORK_FACTOR = 10;

module.exports = function(app, config) {

	var store = config.store;

	app.post('/api/users', function(req, res) {

		// Email is required.
		if (!req.body.email) {
			return res.json(401, 'Email is required to create a user.');
		}

		// Password is required.
		if (!req.body.password) {
			return res.json(401, 'Password is required to create a user.');
		}

		// Make sure the user doesn't already exist in the db.
		store.find({email:req.body.email.toLowerCase()}, function(err, users){
			// If user exists, return error.
			if (users[0]) {
				return res.json(401, 'User already exists');
			}

			// Generate a salt.
			bcrypt.genSalt(SALT_WORK_FACTOR, function(err, salt) {
			  if (err) return res.json(err);

			  // Hash the password.
			  bcrypt.hash(req.body.password, salt, function(err, hash) {
			    if (err) return res.json(401, err);

			    // Prepare the user.
			    var data = {
			    	email: req.body.email.toLowerCase(),
			    	password: hash,
			    	verified: true
			    };

			    // Create the user.
			    store.create(data, function(err, user) {
			    	if (err) {
			    		return res.json('401', err);

		    		// User created successfully
			    	} else if (user) {
			    		// Remove password.
			    		delete user.password;
			    		// Create a token.
		    			var auth = token.generate(user, config.secret);
			    		return res.json(auth);
			    	}
			    });
			  });
			});
		});
	});
};