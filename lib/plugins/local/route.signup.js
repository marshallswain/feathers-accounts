'use strict';

var bcrypt = require('bcrypt'),
  token = require('./token'),
  SALT_WORK_FACTOR = 10;

module.exports = function(app, config) {

  app.post('/api/users', function(req, res) {

		var store = app.service(config.store);

    // Email is required.
    if (!req.body.email) {
      return res.json({
      	error:'missing email',
      	message:'Email is required to create a user.'
	    });
    }

    // Password is required.
    if (!req.body.password) {
      return res.json({
      	error:'missing password',
      	message: 'Password is required to create a user.'
      });
    }

    // Make sure the user doesn't already exist in the db.
    store.find({
      email: req.body.email.toLowerCase()
    }, function(err, users) {
			// If user exists, return error.
			if (users[0]) {
				return res.json({
					error:'user exists',
					message:'User already exists'
				});
			}

			// Generate a salt.
			bcrypt.genSalt(SALT_WORK_FACTOR, function(err, salt) {
				if (err) return res.status(500).json(err);

				// Hash the password.
				bcrypt.hash(req.body.password, salt, function(err, hash) {
					if (err) return res.status(500).json(err);

					// Prepare the user.
					var data = {
						email: req.body.email.toLowerCase(),
						password: hash,
						verified: false
					};

					// Create the user.
					store.create(data, function(err, user) {
						if (err) {
							return res.status(500).json(err);

						// User created successfully
						} else if (user) {
							// Remove password.
							delete user.password;
							// Create a token.
							var auth = token.generate(user, config.local.secret);
							return res.json(auth);
						}
					});
				});
			});
		});
  });
};