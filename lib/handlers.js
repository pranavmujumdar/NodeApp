/*
 *  Request handlers
 */


// Dependencies


// Define the handlers 
var handlers = {};

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