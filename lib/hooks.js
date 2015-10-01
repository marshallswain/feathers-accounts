var bcrypt = require('bcrypt'),
 SALT_WORK_FACTOR = 10;
var randomString = require('random-string');
var errors = require('feathers').errors.types;
var mandrill = require('mandrill-api');
var mandrill_client = new mandrill.Mandrill('mandrill-api-key');


/**
 * The functions below are hooks for use on each service.  You must have feathers-hooks installed for them to work.
 * If auth has been implemented, you can find the user object at hook.params.user.
 * All of these assume that data belonging to a user contains a user_id.
 */





/**
 * Only authenticated users allowed, period!
 *
 * find, get, create, update, remove
 */
exports.requireAuth = function (hook, next) {
  if (!hook.params.user) {
		// TODO: Add proper error message and code here.
    return next('Please include a valid auth token in the Authorization header.');
  } else {
    return next(null, hook);
  }
};


/**
 * Set the userId as the owner.
 *
 * find, get, create, update, remove
 */
exports.setOwner = function (hook, next) {
  hook.params.query.userId = hook.params.user._id;
  return next(null, hook);
};


/**
 * Checks that the action is performed by an admin or owner of the userId.
 *
 * find, get, create, update, remove
 */
exports.verifyOwnership = function (hook, next) {
  if (hook.params.user.admin) {
    hook.params.query.userId = hook.params.user._id;
  };
  return next(null, hook);
};


/**
 * Set the userId as the owner.
 *
 * find, get, create, update, remove
 */
exports.setOwnerIfNotAdmin = function (hook, next) {
  if (!hook.params.user.admin) {
    hook.params.query.userId = hook.params.user._id;
  }
  return next(null, hook);
};


/**
 * isSelf - non-admins can't see other users.
 * USER service only!
 *
 * find, get, create, update, remove
 */
exports.isSelf = function (hook, next) {
  if (!hook.params.user.admin) {
    hook.params.query._id = hook.params.user._id;
  }
  return next(null, hook);
};



/**
 * Encrypt password update
 * If data.updatePassword is set, encrypt and save the password.
 *
 * update
 */
exports.encryptPassword = function (hook, next) {


  // Allow user to view records without a userId.
  if (hook.data.updatePassword && hook.data.password) {

    bcrypt.genSalt(SALT_WORK_FACTOR, function(err, salt) {
      if (err) return next(err);

      bcrypt.hash(hook.data.password, salt, function(err, hash) {
        if (err) return next(err);
        hook.data.password = hash;
        return next(null, hook);
      });
    });
  } else {
    delete hook.data.password;
    return next(null, hook);
  }
};

/**
 * lowercaseEmail
 * If email is passed in, lowercase it for consistent logins.
 *
 * update
 */
exports.lowercaseEmail = function (hook, next) {

  // Allow user to view records without a userId.
  if (hook.data.email) {
    hook.data.email = hook.data.email.toLowerCase();
  }
  return next(null, hook);
};


/**
 * Authenticated users can have their own records (with userId),
 * and non-authenticated users can view records without a userId.
 *
 * find, get, create, update, remove
 */
exports.requireAuthForPrivate = function(hook, next){

  // If no user, limit to public records (no userId)
  if (!hook.params.user) {
    hook.params.query.userId = null;
    return next();
  }

  return next(null, hook);
};


/**
 * Set up the userId on data.
 *
 * create
 */
exports.setUserID = function(hook, next){

  // If a user is logged in, set up the userId on the data.
  if (hook.params && hook.params.user && !hook.data.userId) {
    hook.data.userId = hook.params.user._id;
  }
  return next(null, hook);
};


/**
 * If the user is not an admin, remove any admin attribute.  This prevents
 * unauthorized users from setting other users up as administrators.
 * This typically would be used on a user-type service.
 *
 * create, update
 */
exports.requireAdminToSetAdmin = function(hook, next){

  // If not logged in or logged in but not an admin,
  if (hook.params.user && !hook.params.user.admin) {

    // delete admin before save.
    delete hook.data.admin;
  }

  return next(null, hook);
};


/**
 * When a new user is created by a non-admin, create a secret
 * that will be used as the email verification code.
 * This typically would be used on a user-type service.
 *
 * This could have been done in the Mongoose model if we didn't want
 * to check if the creating user is an admin.
 *
 * create
 */
exports.setSecret = function(hook, next){

  // If not created by an admin...
  if (!(hook.params.user && hook.params.user.admin)) {

    // add a secret to the data.
    hook.data.secret = randomString();
    hook.data.verified = false;
  }

  return next(null, hook);
};


/**
 * When a new user is created by a non-admin, send a verification email.
 *
 * Probably an 'after' filter.
 *
 * create
 */
exports.sendVerificationEmail = function(hook, next){

  // In the case that this isn't an administrator creating the record...
  if (!(hook.params.user && hook.params.user.admin)) {

    var protocol = 'http';
    if (hook.params.headers['x-forwarded-proto'] == 'https') {
      protocol = 'https';
    }

    var url = protocol +'://'+hook.params.headers.host+'/#!verify';

    var body = 'Click here to verify your email address: '+ url + '/' + hook.data.secret +
    '\n\n or go to this page: '+ url +
    '\n\n and enter this code: ' + hook.data.secret;

    var message = {
      'text': body,
      'subject': 'Verify Your Email Address',
      'from_email': 'support@brycecanyonhalfmarathon.com',
      'from_name': 'Bryce Canyon Half Marathon',
      'to': [{
              'email': hook.data.email,
              'type': 'to'
          }],
      'important': true,
      'tags': [
          'bib-email'
      ],
      'subaccount': 'bchm',
      'metadata': {
          'website': 'www.brycecanyonhalfmarathon.com'
      },
      'recipient_metadata': [{
        'rcpt': hook.data.email
      }]
    };

    mandrill_client.messages.send({'message': message, 'async': true}, function(result) {

    }, function(e) {
      // Mandrill returns the error as an object with name and message keys
      console.log('A mandrill error occurred: ' + e.name + ' - ' + e.message);
      // A mandrill error occurred: Unknown_Subaccount - No subaccount exists with the id 'customer-123'
    });

  }

  return next(null, hook);
};
