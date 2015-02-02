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
var local = require('./plugins/local');

module.exports = function(config) {
	return function() {
		// Store is required.
		if (!config.store) {
			throw new Error('A config.store is required');
		}

		var app = this;

		// Middleware to set up req.headers on req.feathers.headers.
		// This lets us detect if REST connections are secured with SSL.
		var setHeaders = function(req, res, next) {
			req.feathers.headers = req.headers;
			next(null, req, res);
		};
		app.all('*', setHeaders);

		// Check for plugins.
		if (config.local) {
			local(app, config);
		} else {
			throw new Error('A plugin must be selected. See the docs for using config.local.');
		}
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
