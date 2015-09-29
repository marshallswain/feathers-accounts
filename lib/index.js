var token = require('./plugins/local/token');
var local = require('./plugins/local');

module.exports = function(config) {
	return function() {
		// Store is required.
		if (!config.service) {
			throw new Error('A config.service is required');
		}
		var app = this;
		config.endpoint = config.endpoint || 'api/users';

		// Middleware to set up req.headers on req.feathers.headers.
		// This lets us detect if REST connections are secured with SSL.
		app.all('*', function(req, res, next) {
			if (!req.feathers) {
				req.feathers = {};
			}
			req.feathers.headers = req.headers;
			return next(null, req, res);
		});

		local(app, config);
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
