/*
 * Server Tasks
 *
 */
'use strict'
// Dependencies
const http = require('http'); //for handling the http requests
const https = require('https');
const url = require("url"); // for getting the url and it's path
const config = require('./config');
const stringDecoder = require('string_decoder').StringDecoder;
const fs = require('fs');
// const _data = require('./lib/data'); for testing the crud operations
const handlers = require('./handlers');
const helpers = require('./helpers');
const path = require('path');

// Instantiate the server module 
var server = {};

//  TESTING THE CRUD operations 
//  @TODO delete this
// helpers.sendTwilioSms('8577637793','test', function(err){
//   console.log('this was the error', err);
// });

//Instantiate http server 
server.httpServer = http.createServer((req, res) => {
  server.commonServer(req, res);
})

//Instantiate the HTTPS server
server.httpsServerOptions = {
  'key': fs.readFileSync(path.join(__dirname,'/../https/key.pem')),
  'cert': fs.readFileSync(path.join(__dirname,'/../https/cert.pem'))
};

server.httpsServer = https.createServer(server.httpsServerOptions, (req, res) => {
  server.commonServer(req, res);
})





// Common server logic for http and https
server.commonServer = (req, res) => {
  // get the url
  var parsedUrl = url.parse(req.url, true);

  // get the path
  var path = parsedUrl.pathname;

  // trim the path
  var trimmedPath = path.replace(/^\/+|\/+$/g, ''); // regex removes the path after the first / and considers all the /es afterwards

  // get the query string in an object
  var queryStringObject = parsedUrl.query;

  // get the method of the request
  var method = req.method.toLowerCase();

  // get the headers from the req
  var headers = req.headers;

  // get the payloads from the request
  var decoder = new stringDecoder('utf-8');
  var buffer = '';
  req.on('data', (data) => {
    buffer += decoder.write(data);
  })

  req.on('end', () => {
    buffer += decoder.end();

    //choose the handler, if not found go to not found
    var chosenHandler = typeof (server.router[trimmedPath]) !== 'undefined' ? server.router[trimmedPath] : handlers.notFound;

    //construct the data object to the handler
    var data = {
      'trimmedPath': trimmedPath,
      'queryStringObject': queryStringObject,
      'method': method,
      'headers': headers,
      'payload': helpers.parseJsonToObject(buffer)
    }

    // route the request to the handler
    chosenHandler(data, function (statusCode, payload) {
      // use status code called back by the handler of default to 200
      statusCode = typeof (statusCode) == 'number' ? statusCode : 200;
      //use the payload by the handler or default empty 
      payload = typeof (payload) == 'object' ? payload : {};

      // convert payload to string 
      var payloadString = JSON.stringify(payload);

      //return the response
      res.setHeader('Content-Type', 'application/json');
      res.writeHead(statusCode);
      res.end(payloadString);

      //log the response
      console.log('Returning this string ', statusCode, payloadString);
    });

    // send the response "older" 
    // console.log("Hello");

    // // log the request
    // console.log("request receieved on path "+ trimmedPath+" and with these query String params ",queryStringObject);
    // console.log("headers ", headers);
    // console.log("PAyload ", buffer);
    // res.end(`request made for ${trimmedPath} with ${method}\n`);
  });
}

//Routes

server.router = {
  'ping': handlers.ping,
  'users': handlers.users,
  'tokens': handlers.tokens,
  'checks': handlers.checks
};

// Init function
server.init = function(){
  // start the HTTP server on the environment port
  server.httpServer.listen(config.httpPort, () => {
    console.log("Server up on " + config.httpPort + " on the " + config.envName + " environment");
  });

  // Start the HTTPS Server  
  server.httpsServer.listen(config.httpsPort, () => {
    console.log("Server up on " + config.httpsPort + " on the " + config.envName + " environment");
  })
}

// Export the server module
module.exports = server;