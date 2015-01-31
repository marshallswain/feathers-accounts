module.exports = function(req, res){

	var User = mongoose.models.User;

	User.find({email:req.body.email.toLowerCase()}, '', {}, function(err, users){
		// Mongoose Errors
		if (err) {
			console.log(err);
			res.json('401', err);

		// User found
		} else if(users[0]){


			// Use the first, and only, matching user.
			var user = users[0];

			// If user isn't verified, send message.
			if (user.verified === false) {

				var secret;

				// If a secret isn't set and the account isn't verified, set up a new secret and send it out.
				// otherwise the original secret will remain and be sent in the verification email.
				if (!user.secret) {
					secret = user.secret = randomString();

					// Update the user in the db with the new secret.
					user.save(function(err, user){});
				} else {
					secret = user.secret;
				}

				// Resend verification email.
				var protocol = 'http';
				if (req.headers['x-forwarded-proto'] == 'https') {
					protocol = 'https';
				}
				var url = protocol +'://'+req.headers.host+'/#!verify';

		    var body = 'Click here to verify your email address: \n '+ url + '/' + secret +
		    '\n\n or go to this page: '+ url +
		    '\n\n and enter this code: ' + secret;

        var message = {
          'text': body,
          'subject': 'Verify Email Address',
          'from_email': 'support@brycecanyonhalfmarathon.com',
          'from_name': 'Bryce Canyon Half Marathon',
          'to': [{
                  'email': user.email,
                  'type': 'to'
              }],
          'important': true,
          'tags': [
            'email-verify'
          ],
          'subaccount': 'bchm',
          'metadata': {
              'website': 'www.brycecanyonhalfmarathon.com'
          },
          'recipient_metadata': [{
            'rcpt': user.email,
            'values': {
              'userID': user.userID
            }
          }]
        };

        mandrill_client.messages.send({'message': message, 'async': true}, function(result) {
          res.json({
          	status:'not verified',
          	message:'That account has not been verified. Please check your email to verify your address.'
          });
        }, function(e) {
          // Mandrill returns the error as an object with name and message keys
          console.log('A mandrill error occurred: ' + e.name + ' - ' + e.message);
          // A mandrill error occurred: Unknown_Subaccount - No subaccount exists with the id 'customer-123'
          res.json({
          	status:'not verified',
          	message:'That account has not been verified. Please check your email to verify your address.'
          });
        });

			// Account already verified
			} else {
				// Compare the password.
				bcrypt.compare(req.body.password, user.password, function(err, isMatch) {

					// Error checking the password.
					if (err){
						return res.json(err);

					// No check-password errors
					} else {
						// Passwords matched, so send a token.
						if (isMatch) {
		          var token = exports.generateToken(user);
				      return res.json(token);

				    // Passwords didn't match.
						} else {
							return res.json({
								status:'invalid login',
								message: 'Invalid Login'
							});
						}
					}
				});
			}

		// User not found.
		} else {
			return res.json({
				status:'invalid login',
				message: 'Invalid Login'
			});
		}
	});
}