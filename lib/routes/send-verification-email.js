var randomString = require('random-string');
var mand = require('mandrill-api');

exports.sendVerificationEmail = function(user, config, req){
  
  var mandrill = new mand.Mandrill(config.mandrill.key);

  var secret;

  // If a secret isn't set and the account isn't verified, set up a secret and send it out.
  if (!user.secret) {
    secret = user.secret = randomString();

    // Update the user in the db with the new secret.
    app.service(config.endpoint).update(user[config.id], user, function(err){
      if (err) {
        res.status(500).json(err);
      }
    });

    // otherwise the original secret will remain and be sent in the verification email.
  } else {
    secret = user.secret;
  }

  // Resend verification email.
  var protocol = 'http';
  if (req.headers['x-forwarded-proto'] === 'https') {
    protocol = 'https';
  }
  var url = protocol + '://' + req.headers.host + config.mandrill.verifyURL || '/#!verify';

  var body = 'Click here to verify your email address: \n ' + url + '/' + secret +
    '\n\n or go to this page: ' + url +
    '\n\n and enter this code: ' + secret;

  var message = {
    'text': body,
    'subject': 'Verify Email Address',
    'from_email': config.mandrill.from_email,
    'from_name': config.mandrill.from_name,
    'to': [{
      'email': user.email,
      'type': 'to'
    }],
    'important': true,
    'tags': [
      'verify-email'
    ],
    'subaccount': config.mandrill.subaccount,
    'metadata': {
      'website': config.mandrill.website
    },
    'recipient_metadata': [{
      'rcpt': user.email,
      'values': {
        'userID': user.userID
      }
    }]
  };

  mandrill.messages.send({
    'message': message,
    'async': true
  }, function() {
    return res.json({
      status: 'not verified',
      message: 'That account has not been verified. Please check your email to verify your address.'
    });
  }, function(e) {
    // Mandrill returns the error as an object with name and message keys
    console.log('A mandrill error occurred: ' + e.name + ' - ' + e.message);
    // A mandrill error occurred: Unknown_Subaccount - No subaccount exists with the id 'customer-123'
    // TODO: Need a new error here, since something happened on email server.
    return res.json(e);
  });
}