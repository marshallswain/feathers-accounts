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
	if (!config.secret) {
		throw new Error('A config.secret is required');
	}

	// TODO: Decouple Mandrill & pluginify. Offer other options.
	// Mandrill Key is required.
	if (!config.mandrill.key) {
		throw new Error('A config.mandrill.key is required');
	}

	// Default id value is _id
	config.id = config.id || '_id';

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

	// Pass in a secret and passwords to update a user's password.
	require('./route.pw-update')(app, config);
};