/*
 *  Request handlers
 */


// Dependencies
const _data = require('./data');
const helpers = require('./helpers');
const {
    update
} = require('./data');
// Define the handlers 
var handlers = {};

handlers.users = (data, callback) => {
    var acceptableMethods = ['post', 'get', 'put', 'delete'];
    if (acceptableMethods.indexOf(data.method) > -1) {
        handlers._users[data.method](data, callback);
    } else {
        callback(405, 'Method not allowed');
    }
};

// Container for all hte CRUD methods for hte users
handlers._users = {};

// users POST
// firstname, lastname, phone, password, tosAgreement
// optional data: none
handlers._users.post = function (data, callback) {
    // check all required fields are filled out
    var firstName = typeof (data.payload.firstName) == 'string' && data.payload.firstName.trim().length > 0 ? data.payload.firstName.trim() : false;
    var lastName = typeof (data.payload.lastName) == 'string' && data.payload.lastName.trim().length > 0 ? data.payload.lastName.trim() : false;
    var phone = typeof (data.payload.phone) == 'string' && data.payload.phone.trim().length == 10 ? data.payload.phone.trim() : false;
    var password = typeof (data.payload.password) == 'string' && data.payload.password.trim().length > 0 ? data.payload.password.trim() : false;
    var tosAgreement = typeof (data.payload.tosAgreement) == 'boolean' && data.payload.tosAgreement == true ? true : false;

    if (firstName && lastName && phone && password && tosAgreement) {
        // Check existing user for similar phone number, must be unique
        _data.read('users', phone, function (err, data) {
            // if we get a read error it means user doesn't exist
            if (err) {
                //hash the password
                var hashedPassword = helpers.hash(password);
                if (hashedPassword) {
                    // create the user object
                    var userObject = {
                        'firstName': firstName,
                        'lastName': lastName,
                        'phone': phone,
                        'hashedPassword': hashedPassword,
                        'tosAgreement': true
                    };

                    // store the user
                    _data.create('users', phone, userObject, function (err) {
                        if (!err) {
                            callback(200);
                        } else {
                            console.log(err);
                            callback(500, {
                                'Error': 'Could not create a new password'
                            })
                        }
                    })
                } else {
                    callback(500, {
                        'Error': 'Password couldn\'t be hashed'
                    });
                }
            } else {
                //user exists
                callback(400, {
                    'Error': 'User Exists'
                });
            }
        });
    } else {
        callback(400, {
            'Error': 'Missing required fields'
        })
    }

}

// users GET
// required : phone
// optional : none
// @TODO authenticate users
handlers._users.get = function (data, callback) {
    // Check phone number is valid
    var phone = typeof (data.queryStringObject.phone) == 'string' && data.queryStringObject.phone.trim().length == 10 ? data.queryStringObject.phone : false;
    if (phone) {
        _data.read('users', phone, function (err, data) {
            if (!err && data) {
                // remove the hashed password
                delete data.hashedPassword;
                callback(200, data);
            } else {
                callback(404, {
                    'Error': 'User does not exist'
                });
            }
        })
    } else {
        callback(400, {
            'Error': 'Required phone number'
        })
    }
}

// users PUT
// required Data : phone
// Optional data : fname, lastname, password, at least one must be specified
// @todo Only let authenticated users update their info
handlers._users.put = function (data, callback) {
    // check for the required field
    var phone = typeof (data.payload.phone) == 'string' && data.payload.phone.trim().length == 10 ? data.payload.phone : false;
    // check for the optional fields
    var firstName = typeof (data.payload.firstName) == 'string' && data.payload.firstName.trim().length > 0 ? data.payload.firstName.trim() : false;
    var lastName = typeof (data.payload.lastName) == 'string' && data.payload.lastName.trim().length > 0 ? data.payload.lastName.trim() : false;
    var password = typeof (data.payload.password) == 'string' && data.payload.password.trim().length > 0 ? data.payload.password.trim() : false;

    // error if the phone is invalid
    if (phone) {
        //error if nothing is sent to update
        if (firstName || lastName || phone) {
            // read the user based off of the phone number
            _data.read('users', phone, function (err, data) {
                if (!err && data) {
                    //proceed with the request
                    if (firstName) {
                        data.firstName = firstName;
                    }
                    if (lastName) {
                        data.lastName = lastName;
                    }
                    if (password) {
                        data.hashedPassword = helpers.hash(password);
                    }
                    // Store the new object to the disk
                    _data.update('users', phone, data, function (err) {
                        if (!err) {
                            callback(200);
                        } else {
                            console.log(err);
                            callback(500, {
                                'Error': 'Could not update the record'
                            });
                        }
                    })
                } else {
                    callback(400, {
                        'Error': 'User Not Found'
                    })
                }
            })
        } else {
            callback(400, {
                'Error': 'Missing fields to update'
            });
        }
    } else {
        callback(400, {
            'Error': 'missing phone number for PUT'
        });
    }

}
// users DELETE
// required phone
// @todo Only let authenticated users can delete their own
// @ts-ignore Cleanup everything related to the user 
handlers._users.delete = function (data, callback) {
      // Check phone number is valid
      var phone = typeof (data.queryStringObject.phone) == 'string' && data.queryStringObject.phone.trim().length == 10 ? data.queryStringObject.phone : false;
      if (phone) {
          _data.read('users', phone, function (err, data) {
              if (!err && data) {
                _data.delete('users', phone, function(err){
                    if(!err){
                        callback(200);
                    }
                    else{
                        callback(500, {'Error': 'could not delete the user'})
                    }
                })
              } else {
                  callback(400, {
                      'Error': 'User does not exist'
                  });
              }
          })
      } else {
          callback(400, {
              'Error': 'Required phone number'
          })
      }
}

// token handlers
handlers.tokens = (data, callback) => {
    var acceptableMethods = ['post', 'get', 'put', 'delete'];
    if (acceptableMethods.indexOf(data.method) > -1) {
        handlers._tokens[data.method](data, callback);
    } else {
        callback(405, 'Method not allowed');
    }
};

// Container for all the tokens
handlers._tokens = {};

// tokens post
// Required data : Phone And password
// Optional Data : none
handlers._tokens.post = function(data, callback){
    var phone = typeof (data.payload.phone) == 'string' && data.payload.phone.trim().length == 10 ? data.payload.phone.trim() : false;
    var password = typeof (data.payload.password) == 'string' && data.payload.password.trim().length > 0 ? data.payload.password.trim() : false;
    if(phone && password){
        _data.read('users', phone, function(err,userData){
            if(!err && userData){
                // Hash the sent password, compare it to the password stored in the user object
                var hashedPassword = helpers.hash(password);
                if(hashedPassword == userData.hashedPassword){
                    // if valid, create a new token with a random name, set expiration data one hour
                    var tokenId = helpers.createRandomString(20);
                    var expires = Date.now() + (1000*60*60);
                    var tokenObject = {
                        'phone' : phone,
                        'id': tokenId,
                        'expires' : expires
                    } 

                    // store the token
                    _data.create('tokens',tokenId,tokenObject, function(err){
                        if(!err){
                            callback(200, tokenObject)
                        }
                        else{
                            callback(500, {'Error':'can\'t create the token'})
                        }
                    })
                }
                else{
                    callback(400, {'Error' : ' Wrong password'});
                }

            }
            else {
                callback(400, {'Error':'User dont exist mf'})
            }
        });
    }
    else{
        callback(400, {'error' : 'Missing Required Fields'})
    }
};

// Tokens get 
// Required Data : Token ID
// Optional Data : None
handlers._tokens.get = function(data, callback){
    // Check Token Id is valid
    var id = typeof (data.queryStringObject.id) == 'string' && data.queryStringObject.id.trim().length == 20 ? data.queryStringObject.id : false;
    if (id) {
        _data.read('tokens', id, function(err, tokenData) {
            if (!err && tokenData) {
                callback(200, tokenData);
            } else {
                callback(404, {
                    'Error': 'Token does not exist'
                });
            }
        })
    } else {
        callback(400, {
            'Error': 'Required Token number'
        })
    }
};

handlers._tokens.delete = function(data, callback){

};

handlers._tokens.put = function(data, callback){

};
// ping Handler
handlers.ping = (data, callback) => {
    // callback an http status code and a payload object
    callback(200);
};
// default to notFound
handlers.notFound = (data, callback) => {
    callback(404);
};

// Export the Handlers modules
module.exports = handlers;