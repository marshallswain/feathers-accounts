'use strict';

var bcrypt = require('bcrypt');
var randomString = require('random-string');
var mand = require('mandrill-api');
var token = require('./token');


module.exports = function(app, config) {

	var mandrill = new mand.Mandrill(config.local.mandrill.key);

	app.post('/api/login', function(req, res) {

		var store = app.service(config.store);

		store.find({
			email: req.body.email.toLowerCase()
		}, function(err, users) {

			if (err) {
				// Server error.
				res.status(500).json(err);

				// User found
			} else if (users[0]) {

				// Use the first, and should be only, matching user.
				var user = users[0];

				// If user isn't verified, we will need to resend the verification message.
				if (user.verified === false) {

					var secret;

					// If a secret isn't set and the account isn't verified, set up a secret and send it out.
					if (!user.secret) {
						secret = user.secret = randomString();

						// Update the user in the db with the new secret.
						store.update(user[config.local.id], user, function(err){
							if (err) {
								res.status(500).json(err);
							}
						});

						// otherwise the original secret will remain and be sent in the verification email.
					} else {
						secret = user.secret;
					}

					// Resend verification email.
					var protocol = 'http';
					if (req.headers['x-forwarded-proto'] == 'https') {
						protocol = 'https';
					}
					var url = protocol + '://' + req.headers.host + config.local.mandrill.verifyURL || '/#!verify';

					var body = 'Click here to verify your email address: \n ' + url + '/' + secret +
						'\n\n or go to this page: ' + url +
						'\n\n and enter this code: ' + secret;

					var message = {
						'text': body,
						'subject': 'Verify Email Address',
						'from_email': config.local.mandrill.from_email,
						'from_name': config.local.mandrill.from_name,
						'to': [{
							'email': user.email,
							'type': 'to'
						}],
						'important': true,
						'tags': [
							'verify-email'
						],
						'subaccount': config.local.mandrill.subaccount,
						'metadata': {
							'website': config.local.mandrill.website
						},
						'recipient_metadata': [{
							'rcpt': user.email,
							'values': {
								'userID': user.userID
							}
						}]
					};

					mandrill.messages.send({
						'message': message,
						'async': true
					}, function() {
						return res.json({
							status: 'not verified',
							message: 'That account has not been verified. Please check your email to verify your address.'
						});
					}, function(e) {
						// Mandrill returns the error as an object with name and message keys
						console.log('A mandrill error occurred: ' + e.name + ' - ' + e.message);
						// A mandrill error occurred: Unknown_Subaccount - No subaccount exists with the id 'customer-123'
						// TODO: Need a new error here, since something happened on email server.
						return res.json(e);
					});

				// Account already verified
				} else {
					// Compare the password.
					bcrypt.compare(req.body.password, user.password, function(err, isMatch) {

						// Error checking the password.
						if (err) {
							return res.status(500).json(err);

							// No check-password errors
						} else {
							// Passwords matched, so send a token.
							if (isMatch) {
								var auth = token.generate(user, config.local.secret);
								return res.json(auth);

								// Passwords didn't match.
							} else {
								return res.json({
									status: 'invalid login',
									message: 'Invalid Login'
								});
							}
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