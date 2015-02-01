'use strict';
/**
 * Contains all of the functions necessary to deal with Authentication.
 *
 * 1. decodeToken: decodes a token into user data using.
 * 2. getToken middleware that sets up req.user if a token is passed in REST.
 * 3. Login
 */

var decodeToken = require('./token').decode;
var getToken = require('./token').get;

module.exports = function(store) {
	return function() {
		var app = this;


		var loginRoute = require('./route.login');
		var tokenLoginRoute = require('./route.token-login');
		var pwResetReq = require('./route.pw-reset-request');
		var pwChange = require('./route.pw-change');
		var verifyRoute = require('./route.verify');

		// Middleware to set up req.headers on req.feathers.headers.
		// This lets us detect if connections are secured with SSL.
		var setHeaders = function(req, res, next) {
			req.feathers.headers = req.headers;
			next(null, req, res);
		};

		// All REST routes will set up req.feathers.user if a token is passed.
		app.all('*', setHeaders);
		app.post('*', getToken);


		/* * * Custom REST routes. * * */

		// Auth Setup.
		// require('./auth').setup(app, store);

		// POST login.
		app.post('/api/login', loginRoute);

		// POST token login
		app.post('/api/tokenlogin', tokenLoginRoute);

		// Verify a user's account by passing a secret.
		app.post('/api/verify', verifyRoute);

		// Send a password-reset email.
		app.post('/api/passwordemail', pwResetReq);

		// Pass in a secret and password to change a user's password.
		app.post('/api/passwordchange', pwChange);
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
				decodeToken(socket.handshake.query.token, function(err, data) {
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
