'use strict';
/**
 * Contains all of the functions necessary to deal with user
 * signup and authentication.
 *
 * 1. decodeToken: decodes a token into user data using.
 * 2. getToken middleware that sets up req.user if a token is passed in REST.
 * 3. Login
 */
var token = require('./token');

module.exports = function(config) {
	return function() {
		var devMode = this.settings.env === 'development';

		// Store is required.
		if (!config.store) {
			throw new Error('A config.store is required');
		}

		// Secret is required.
		if (!config.secret) {
			throw new Error('A config.secret is required');
		}

		// TODO: Decouple Mandrill & pluginify.
		// Mandrill Key is required.
		if (!config.mandrill.key) {
			throw new Error('A config.mandrill.key is required');
		}

		var app = this;

		// Middleware to set up req.headers on req.feathers.headers.
		// This lets us detect if connections are secured with SSL.
		var setHeaders = function(req, res, next) {
			req.feathers.headers = req.headers;
			next(null, req, res);
		};

		// All REST routes will set up req.feathers.user if a token is passed.
		app.all('*', setHeaders);
		app.post('*', token.get);


		/* * * Custom REST routes. * * */

		// If on a development machine, allow creating users directly.
		if (devMode) {
			require('./route.create-user')(app, config);
		}

		// POST login.
		require('./route.login')(app, config);

		// POST token login
		require('./route.token-login')(app, config);

		// Verify a user's account by passing a secret.
		require('./route.verify')(app, config);

		// Send a password-reset email.
		require('./route.pw-reset-request')(app, config);

		// Pass in a secret and password to change a user's password.
		require('./route.pw-change')(app, config);
	};
};

/**
 * Socket middleware to set up token authentication.
 * For use inside app.configure(feathers.socketio())
 */
module.exports.socket = function(io) {

	/**
	 * Checks for a token and decodes. Colocates the user on the socket.
	 * This handles authentication only. (identifying the user)
	 * Authorization (allow or deny) is done in feathers-hooks on each service.
	 */
	io.use(function(socket, next) {

		// Is there a token in place...
		if (socket.handshake.query.token) {
				// ...decode the token.
				token.decode(socket.handshake.query.token, function(err, data) {
					if (err) {
						next(null, true);

					// If we got an email out of the token...
					} else if (data.email) {
						// Set up the data on feathers.user
						socket.feathers = {
							user: data
						};
						next(null, true);
					}
				});

		// If token was passed...
		} else {
			// ... still grant access. Hooks will take care of Auth.
			next(null, true);
		}
	});
};
