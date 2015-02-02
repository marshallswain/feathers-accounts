'use strict';

module.exports = function(app, store) {
	app.post('/api/verify', function(req, res) {

		User.find({
			secret: req.body.secret
		}, '', {}, function(err, users) {
			// Mongoose Errors
			if (err) {
				console.log(err);
				res.json('401', err);

				// User found
			} else if (users[0]) {
				var user = users[0];
				user.secret = undefined;
				user.verified = true;
				// Update the user and send back the credentials.
				user.save(function(err, user) {
					if (err) {
						console.log(err);
						res.json(err);
					} else {
						// ...and send the token to the user.
						var token = exports.generateToken(user);
						return res.json(token);
					}
				});
				// Couldn't find a user with that secret.
			} else {
				res.json({
					status: 'invalid secret',
					message: 'We couldn\'t find a user with that secret.'
				});
			}
		});
	});
};