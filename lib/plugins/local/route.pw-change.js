'use strict';

// Pass in a secret and password to change a user's password.
module.exports = function(app, store) {
	app.post('/api/passwordchange', function(req, res) {

		if (!req.body.secret) {
			return res.json({
				status: 'missing secret',
				message: 'Please include the secret to look up the correct user.'
			});
		}

		if (!req.body.password || !req.body.password2) {
			return res.json({
				status: 'missing password',
				message: 'Please include the password and matching password2 to change the password.'
			});
		}

		if (req.body.password !== req.body.password2) {
			return res.json({
				status: 'password mismatch',
				message: 'The passwords must match'
			});
		}

		var User = mongoose.models.User;

		User.findOne({
			secret: req.body.secret
		}, '', {}, function(err, user) {
			// Mongoose Errors
			if (err) {
				console.log(err);
				return res.json('401', err);
				// A user was found, save the password.
			} else if (user) {

				user.password = req.body.password;
				user.secret = undefined;

				user.save(function() {
					// ...and send the token to the user.
					var token = exports.generateToken(user);
					return res.json(token);
				});

				// Couldn't find the user using the passed code
			} else {
				res.json({
					status: 'invalid code',
					message: 'We could not find a user using that code.'
				});
			}
		});
	});
};