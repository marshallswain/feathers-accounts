// Sends a password-reset request.
module.exports = function(req, res){

	if (!req.body.email) {
		return res.json({
			status: 'email required',
			message: 'Please pass an email address to send a password reset request.'
		});
	} else {

		var User = mongoose.models.User;

		User.find({email:req.body.email.toLowerCase()}, '', {}, function(err, users){
			// Mongoose Errors
			if (err) {
				console.log(err);
				return res.json('401', err);

			// A user was found, create a secret and send a password change request.
			} else if (users[0]) {
				var user = users[0];

				var secret;

				if (!user.secret) {
					secret = user.secret = randomString();
				} else {
					secret = user.secret;
				}
				// Update the user and send back the credentials.
				user.save(function(err, user){

					// Resend verification email.
					var protocol = 'http';
					if (req.headers['x-forwarded-proto'] == 'https') {
						protocol = 'https';
					}
					var url = protocol +'://'+req.headers.host+'/#!passwordchange';

					var body = 'Click here to change your password: \n '+ url + '/' + secret +
					'\n\n or go to this page: '+ url +
					'\n\n and enter this code: ' + secret;

					var message = {
            'text': body,
            'subject': 'Password Change Request',
            'from_email': 'support@brycecanyonhalfmarathon.com',
            'from_name': 'Bryce Canyon Half Marathon',
            'to': [{
                    'email': user.email,
                    'type': 'to'
                }],
            'important': true,
            'tags': [
                'change-password'
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
						return res.json('success');
          }, function(e) {
            // Mandrill returns the error as an object with name and message keys
            console.log('A mandrill error occurred: ' + e.name + ' - ' + e.message);
            // A mandrill error occurred: Unknown_Subaccount - No subaccount exists with the id 'customer-123'
						return res.json({success:true});
          });

				});

			// No user was found.
			} else {
				return res.json({
					status: 'User Not Found',
					message: 'Could not find a user with that email address.'
				});

			}
		});
	}
}