/**
 * Contains all of the functions necessary to deal with Authentication.
 *
 * 1. decodeToken: decodes a token into user data using.
 * 2. getToken middleware that sets up req.user if a token is passed in REST.
 * 3. Login
 */

var decodeToken = require('./auth').decodeToken;
var getToken = require('./token').get;

module.exports = function(store, feathers){
	return function(){
		var app = this;


		var loginRoute = require('./route.login');
		var tokenLoginRoute = require('./route.token-login');
		var pwResetReq = require('./route.pw-reset-request');
		var pwChange = require('./route.pw-change');
		var verifyRoute = require('./route.verify');

		// Middleware to set up req.headers on req.feathers.headers.
		var setHeaders = function(req, res, next){
			req.feathers.headers = req.headers;
			next(null, req, res);
		};

		// All REST routes will set up req.feathers.user if a token is passed.
		app.all('*', setHeaders);
		app.post('*', getToken);



		/* * * Custom REST routes. * * */

		// Auth Setup.
		// require('./auth').setup(app, store);

		// // POST login.
		// app.post('/api/login', loginRoute);

		// // POST token login
		// app.post('/api/tokenlogin', tokenLoginRoute);

		// // Verify a user's account by passing a secret.
		// app.post('/api/verify', verifyRoute);

		// // Send a password-reset email.
		// app.post('/api/passwordemail', pwResetReq);

		// // Pass in a secret and password to change a user's password.
		// app.post('/api/passwordchange', pwChange);
};

/* * * Socket.io Setup. * * */

module.exports.socket = function(io){
  	console.log('Second Socket Config.')
		// io.set('transports', [
		// 	'websocket'
	  // ]);
	  /* * * Checks for a token and decodes/colocates the user on the socket * * */
	  io.use(function(socket, callback) {

	  	console.log('Second use.');

	  	// Is there a token in place
	    if (socket.handshake.query.token) {
	  		decodeToken(socket.handshake.query.token, function(err, data){
	  			if (err) {
	  				console.log(err);
	  			} else if (data.email) {

	  				socket.feathers = {
	  					user: data
	  				};
	  				callback(null, true);
	  			}
	  		});
	  	// Nope. No token. Deny access to listen.
	  	} else {
	  		console.log('test');
	  		// callback(null, false);
	  		callback(null, true);
	  	}
	  });

  	/* * * Add your own custom events * * */
    // io.on('connection', function(socket) {
      // socket.broadcast.emit('news', { hello: 'world' });
    // });

	  /* * * Add your own middleware * * */
	  // io.use(function(socket, callback){
	  // 	// Do your custom logic here.
	  // });

}