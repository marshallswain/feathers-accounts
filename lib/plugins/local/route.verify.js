'use strict';

var token = require('./token');

module.exports = function(app, config) {
	app.post('/api/verify', function(req, res) {

		// Find the user by secret.
		config.store.find({
			query: {
				secret: req.body.secret
			}
		}, function(err, users) {
			if (err) {
				return res.status(500).json(err);
			}
			// If a user was found, verify.
			if (users[0]) {
				var user = users[0];
				user.secret = undefined;
				user.verified = true;

				// Update the user...
				config.store.update(user._id, user, function(err, user) {
					if (err) {
						return res.status(500).json(err);

						// ...and and send back the credentials.
					} else {
						var auth = token.generate(user, config.local.secret);
						return res.json(auth);
					}
				});

			// No user was found with that secret.
			} else {
				return res.status(400).json({
					status: 'invalid secret',
					message: 'We couldn\'t find a user with that secret.'
				});
			}
		});
	});
};