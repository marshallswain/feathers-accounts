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

/* * * Custom REST routes. * * */
module.exports = function(app, config){

	// Secret is required.
	if (!config.local.secret) {
		throw new Error('A config.local.secret is required');
	}

	// TODO: Decouple Mandrill & pluginify. Offer other options.
	// Mandrill Key is required.
	if (!config.local.mandrill.key) {
		throw new Error('A config.local.mandrill.key is required');
	}

	// All REST routes will set up req.feathers.user if a token is passed.
	app.post('*', token.get);

	// POST signup route / create user.
	require('./route.signup')(app, config);

	// Verify a user's account by posting a secret.
	require('./route.verify')(app, config);

	// POST login.
	require('./route.login')(app, config);

	// POST token login
	require('./route.token-login')(app, config);

	// Send a password-reset email.
	require('./route.pw-reset-request')(app, config);

	// Pass in a secret and password to change a user's password.
	require('./route.pw-change')(app, config);
};