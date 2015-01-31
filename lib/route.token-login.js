module.exports = function(req, res){
	// If there's no token, send error.
	if (!req.body.token) {
		res.json({
			status: 'no token',
			message:'token is required for token login.'
		});

	// If there's a token, decode it.
	} else {
		exports.decodeToken(req.body.token, function(err, data){
			// If there was an error decoding the token.
			if (err) {
				res.json({error:'Could not decode token. Please login.'});
			// If the token didn't contain any user data...
			} else if (!data.email) {
				res.json({error:'Invalid token. Please login.'});
			// If the decode was successful...
			} else {
				var User = mongoose.models.User;
				User.findOne({email:data.email}, function(err, user){
					// Mongoose Errors
					if (err) {
						console.log(err);
						return res.json('401', err);
					// A user was found, save the password.
					} else {
						return res.json(user);
					}
				});
			}
		});
	}
}