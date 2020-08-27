/*
 *  Request handlers
 */


// Dependencies
const _data = require('./data');
const helpers = require('./helpers');
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
    var phone = typeof(data.queryStringObject.phone) == 'string' && data.queryStringObject.phone.trim().length == 10 ?  data.queryStringObject.phone : false;
    if (phone){
        _data.read('users',phone, function(err, data){
            if(!err && data){
                // remove the hashed password
                delete data.hashedPassword;
                callback(200, data);
            }
            else{
                callback(404, {'Error': 'User does not exist'});
            }
        })
    }
    else{
        callback(400, {'Error':'Required phone number'})
    }
}

// users PUT
handlers._users.put = function (data, callback) {

}
// users DELETE
handlers._users.delete = function (data, callback) {

}

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