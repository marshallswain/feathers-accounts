'use strict';

var bcrypt = require('bcrypt'),
	token = require('./token'),
	SALT_WORK_FACTOR = 10;

// Pass in a secret and password to change a user's password.
module.exports = function(app, config) {
	app.post('/api/password-update', function(req, res) {

		if (!req.body.secret) {
			return res.json({
				error: 'missing code',
				message: 'Please include the password reset code to look up the correct user.'
			});
		}

		if (!req.body.password || !req.body.password2) {
			return res.json({
				error: 'missing password',
				message: 'Please include the password and matching password2 to change the password.'
			});
		}

		if (req.body.password !== req.body.password2) {
			return res.json({
				error: 'password mismatch',
				message: 'The passwords must match'
			});
		}

		config.store.find({
			query: {
				code: req.body.code
			}
		}, function(err, users) {
			if (err) {
				return res.status(500).json(err);
				// A user was found, save the password.
			}
			if (users[0]) {
				var user = users[0];

				// Generate a salt.
				bcrypt.genSalt(SALT_WORK_FACTOR, function(err, salt) {
					if (err) return res.status(500).json(err);

					// Hash the password.
					bcrypt.hash(req.body.password, salt, function(err, hash) {
						if (err) return res.status(500).json(err);

						// Update the password.
						user.password = hash;

						// Remove the code, so it can only be used once.
						delete user.code;

						// Update the user in the db.
						config.store.update(user[config.local.id], user, function(err, user) {

							// Remove the password.
							delete user.password;

							// and send the auth object to the client.
							var auth = token.generate(user, config.local.secret);
							return res.json(auth);
						});
					});
				});

				// Couldn't find the user using the given secret
			} else {
				res.json({
					error: 'invalid secret',
					message: 'We could not find a user with that secret.'
				});
			}
		});
	});
};