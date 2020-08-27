/*
 *  Request handlers
 */


// Dependencies
_data = require('./data');

// Define the handlers 
var handlers = {};

handlers.users = (data, callback) =>
{
    var acceptableMethods = ['post','get','put','delete'];
    if(acceptableMethods.indexOf(data.method) > -1){
        handlers._users[data.method](data, callback);
    }
    else{
        callback(405,'Method not allowed');
    }
};

// Container for all hte CRUD methods for hte users
handlers._users = {};

// users POST
// firstname, lastname, phone, password, tosAgreement
// optional data: none
handlers._users.post = function(data, callback){
    // check all required fields are filled out
    var firstName = typeof(data.payload.firstName) == 'string' &&  data.payload.firstName.trim().length > 0 ? data.payload.firstName.trim() : false; 
    var lastName = typeof(data.payload.lastName) == 'string' &&  data.payload.lastName.trim().length > 0 ? data.payload.lastName.trim() : false;
    var phone = typeof(data.payload.phone) == 'string' &&  data.payload.phone.trim().length > 10 ? data.payload.phone.trim() : false;
    var password = typeof(data.payload.password) == 'string' &&  data.payload.password.trim().length > 0 ? data.payload.password.trim() : false;
    var tosAgreement = typeof(data.payload.tosAgreement) == 'boolean' &&  data.payload.tosAgreement == true ? true : false;

    if(firstName && lastName && phone && password && tosAgreement){
        // Check existing user for similar phone number, must be unique
        _data.read('users', phone, function(err, data){
            // if we get a read error it means user doesn't exist
            if(err){
                //hash the password
                var hashedPassword = helpers.hash(password);
            }
            else{
                //user exists
                callback(400,{'Error':'User Exists'});
            }
        });
    }
    else{
        callback(400, { 'Error': 'Missing required fields' })
    }

}

// users GET
handlers._users.get = function(data, callback){
    
}

// users PUT
handlers._users.put = function(data, callback){
    
}
// users DELETE
handlers._users.delete = function(data, callback){
    
}

// ping Handler
handlers.ping = (data, callback) =>
{
    // callback an http status code and a payload object
    callback(200);
};
// default to notFound
handlers.notFound = (data, callback) =>
{
    callback(404);
};

// Export the Handlers modules
module.exports = handlers;