/**
 * index entry for the api
 * 
 */

 // Dependencies
const server = require('./lib/server');
const workers = require('./lib/workers');

// Declare the app
var app = {};

// Init the function

app.init = function(){
  // Start the server
  server.init();

  // Start the workers
  workers.init();

}
// Run the app function
app.init();

// Module Export the app
module.exports = app;