var bcrypt = require('bcrypt');
var token = require('../token');
var utils = require('./send-verification-email');

module.exports = function(app, config) {

	app.post(config.endpoint + '/login', function(req, res) {

		app.service(config.endpoint).find({
			query: {
				email: req.body.email.toLowerCase(),
				_internal:true
			}
		}, function(err, users) {
			if (err) {
				res.status(500).json(err);
			} 
			var user = users[0];
			if (user) {

				// If user isn't verified, we will need to resend the verification message.
				if (user.verified === false) {
					utils.sendVerificationEmail(user, config, req);

				// Account already verified
				} else {
					// Compare the password.
					bcrypt.compare(req.body.password, user.password, function(err, isMatch) {
						if (err) {
							return res.status(500).json(err);
						} 
						// Passwords matched, so send a token.
						if (isMatch) {
							var auth = token.generate(user, config.secret);
							return res.json(auth);

						// Passwords didn't match.
						} else {
							return res.json({
								status: 'invalid login',
								message: 'Invalid Login'
							});
						}
					});
				}

			// User not found.
			} else {
				return res.json({
					error: 'invalid login',
					message: 'Invalid Login'
				});
			}
		});
	});
};