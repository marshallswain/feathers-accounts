var token = require('./token');
var local = require('./local');

/**
 * Contains all of the functions necessary to deal with user
 * signup and authentication.
 *
 * 1. decodeToken: decodes a token into user data using.
 * 2. getToken middleware that sets up req.user if a token is passed in REST.
 * 3. Login
 */
module.exports = function(config) {
	return function() {
		// Store is required.
		if (!config.userService) {
			throw new Error('Please provide a string to lookup the config.userService.');
		}
		// Secret is required.
		if (!config.secret) {
			throw new Error('A config.secret is required to generate auth tokens');
		}
		// TODO: Move Mandrill email sending this to a hook.
		// Mandrill Key is required.
		if (!config.mandrill.key) {
			throw new Error('A config.mandrill.key is required');
		}
	
		// Default id value is _id
		config.id = config.id || '_id';


		var app = this;

		// Middleware to set up req.headers on req.feathers.headers.
		// This lets us detect if REST connections are secured with SSL.
		app.all('*', function(req, res, next) {
			if (!req.feathers) {
				req.feathers = {};
			}
			req.feathers.headers = req.headers;
			return next(null, req, res);
		});
		
		// All REST routes will set up req.feathers.user if a token is passed.
		app.all('*', token.get);

		// POST signup route / create user.
		require('./routes/signup')(app, config);
	
		// Verify a user's account by posting a secret.
		require('./routes/verify')(app, config);
	
		// POST login.
		require('./routes/login')(app, config);
	
		// POST token login
		require('./routes/token-login')(app, config);
	
		// Send a password-reset email.
		require('./routes/pw-reset-request')(app, config);
	
		// Pass in a secret and passwords to update a user's password.
		require('./routes/pw-update')(app, config);
		};
};


/**
 * Socket middleware to set up token authentication.
 * For use inside app.configure(feathers.socketio())
 */
module.exports.socket = function(io) {

	/**
	 * Checks for a token and decodes. Colocates the user on `socket.feathers.user`
	 * This handles authentication only. (identifying the user)
	 * Authorization (allow or deny) is done in feathers-hooks on each service.
	 */
	io.use(function(socket, next) {

		// If there's a token in place, decode it.
		if (socket.handshake.query.token) {
			token.decode(socket.handshake.query.token, function(err, data) {
				if (err) {
					return next(err);
				} 
				socket.feathers = {
					user: data
				};
			});
		} 

		// If no token was passed, still allow the webscoket. Hooks will take care of Auth.
 		return next(null, true);
	});
};
