var randomString = require('random-string');
var mand = require('mandrill-api');

// Sends a password-reset request.
module.exports = function(app, config) {

	var mandrill = new mand.Mandrill(config.mandrill.key);

	app.post(config.endpoint + '/password-reset', function(req, res) {

		var service = app.service(config.endpoint);

		if (!req.body.email) {
			return res.json({
				error: 'email required',
				message: 'Please pass an email address to send a password reset request.'
			});
		} else {

			service.find({
				query: {
					email: req.body.email.toLowerCase()
				}
			}, function(err, users) {
				if (err) {
					return res.status(500).json(err);
				}

				// If a user was found, create a code and send a password change request.
				if (users[0]) {
					var user = users[0];

					var code;

					if (!user.code) {
						code = user.code = randomString();
					} else {
						code = user.code;
					}
					// Update the user with the code and send back the credentials.
					service.update(user[config.id], user, function(err, user) {

						// Resend verification email.
						var protocol = 'http';
						if (req.headers['x-forwarded-proto'] === 'https') {
							protocol = 'https';
						}
						var url = protocol + '://' + req.headers.host + '/#!passwordchange';

						var body = 'Click here to change your password: \n ' + url + '/' + code +
							'\n\n or go to this page: ' + url +
							'\n\n and enter this code: ' + code;

						var message = {
							'text': body,
							'subject': 'Password Change Request',
							'from_email': config.mandrill.from_email,
							'from_name': config.mandrill.from_name,
							'to': [{
								'email': user.email,
								'type': 'to'
							}],
							'important': true,
							'tags': [
								'change-password'
							],
							'subaccount': config.mandrill.subaccount,
							'metadata': {
								'website': config.mandrill.website
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
								success: true
							});
						}, function(e) {
							// Mandrill returns the error as an object with name and message keys
							console.log('A mandrill error occurred: ' + e.name + ' - ' + e.message);
							// A mandrill error occurred: Unknown_Subaccount - No subaccount exists with the id 'customer-123'
							return res.status(500).json(e);
						});

					});

					// No user was found.
				} else {
					return res.json({
						error: 'User Not Found',
						message: 'Could not find a user with that email address.'
					});
				}
			});
		}
	});
};