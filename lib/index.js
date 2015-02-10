'use strict';

var token = require('./plugins/local/token');
var local = require('./plugins/local');

module.exports = function(config) {
	return function() {
		// Store is required.
		if (!config.service) {
			throw new Error('A config.service is required');
		}
		var app = this;
		config.endpoint = config.endpoint || 'api';


		// Middleware to set up req.headers on req.feathers.headers.
		// This lets us detect if REST connections are secured with SSL.
		var setHeaders = function(req, res, next) {
			if (!req.feathers) {
				req.feathers = {};
			}
			req.feathers.headers = req.headers;
			next(null, req, res);
		};
		app.all('*', setHeaders);

		// Check for plugins.
		// TODO: Make it possible to register third party plugins.
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
		// If there's a token in place, decode it
		if (socket.handshake.query.token) {
			token.decode(socket.handshake.query.token, function(err, data) {
				if (err) {
					next(null, true);
				// If it was successful...
				} else if (data.email) {
					// ...set up the data on feathers.user
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
