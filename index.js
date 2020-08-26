/**
 * index for the api
 * 
 */
'use strict'
 // Dependencies
const http = require('http'); //for handling the http requests
const https = require('https');
const url = require("url"); // for getting the url and it's path
const config = require('./config');
const stringDecoder = require('string_decoder').StringDecoder;
const fs = require('fs') ;
const _data = require('./lib/data');


// TESTING THE 
// @TODO delete this
_data.update('test', 'newFile',{'fizz0':'Buzz'}, function(err){
    console.log('this was the error', err);
})
//Instantiate http server 
const httpServer = http.createServer((req, res) => {
    commonServer(req, res);
})

//Instantiate the HTTPS server
const httpsServerOptions = {
    'key': fs.readFileSync('./https/key.pem'),
    'cert': fs.readFileSync('./https/cert.pem')
};

const httpsServer = https.createServer(httpsServerOptions, (req, res) => {
    commonServer(req, res);
})


// start the HTTP server on the environemt port
httpServer.listen(config.httpPort, ()=>{
    console.log("Server up on "+config.httpPort+" on the " + config.envName + " environment");
})

// Start the HTTPS Server  
httpsServer.listen(config.httpsPort, ()=>{
    console.log("Server up on "+config.httpsPort+" on the " + config.envName + " environment");
})

// Common server logic for http and https
var commonServer  = (req, res) => {
    // get the url
    var parsedUrl = url.parse(req.url, true);

    // get the path
    var path = parsedUrl.pathname;
    
    // trim the path
    var trimmedPath = path.replace(/^\/+|\/+$/g,''); // regex removes the path after the first / and considers all the /es afterwards
    
    // get the query string in an object
    var  queryStringObject = parsedUrl.query;
    
    // get the method of the request
    var method = req.method.toLowerCase();

    // get the headers from the req
    var headers = req.headers;

    // get the payloads from the request
    var decoder = new stringDecoder('utf-8');
    var buffer = '';
    req.on('data', (data)=> {
        buffer += decoder.write(data);
    })

    req.on('end',()=>{
        buffer += decoder.end();

        //choose the handler, if not found go to not found
        var chosenHandler = typeof(router[trimmedPath]) !== 'undefined' ? router[trimmedPath] : handlers.notFound;

        //construct the data object to the handler
        var data = {
            'trimmedPath' : trimmedPath,
            'queryStringObject' : queryStringObject,
            'method' : method,
            'headers' : headers,
            'payload' : buffer
        } 

        // route the request to the handler
        chosenHandler(data, function(statusCode, payload){
            // use status code called back by the handler of default to 200
            statusCode = typeof(statusCode) == 'number'? statusCode : 200;
            //use the payload by the handler or default empty 
            payload = typeof(payload) == 'object'? payload : {};

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

//Routes

var router = {
    'ping' : handlers.ping 
}