'use strict';

var token = require('./token');

module.exports = function(app, config) {
	app.post(config.endpoint + '/verify', function(req, res) {

    var service = app.service('feathers-accounts');

		// Find the user by secret.
		service.find({
			query:{
				secret: req.body.secret
			}
		}, function(err, users) {
			if (err) {
				return res.status(500).json(err);
			}
			// If a user was found, verify.
			if (users[0]) {
				var user = users[0];

				// Delete the secret.
				delete user.secret;

				// Mark the user as verified.
				user.verified = true;

				// Update the user...
				service.update(user[config.local.id], user, function(err, user) {
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
				return res.json({
					error: 'invalid secret',
					message: 'We couldn\'t find a user with that secret.'
				});
			}
		});
	});
};