/**
 * index for the api
 * 
 */
'use strict'
 // Dependancies
const http = require('http'); //for handling the http requests
const url = require("url"); // for getting the url and it's path
const { runInNewContext } = require('vm');
const { type } = require('os');
const stringDecoder = require('string_decoder').StringDecoder;
 
// Server config 
const server = http.createServer((req, res) => {
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
            res.writeHead(statusCode);
            res.end(payloadString);

            //log the response

            console.log('Returning this string ', statusCode,payloadString);
        });
        // // send the response
        // console.log("Hello");
        
        // // log the request
        // console.log("request receieved on path "+ trimmedPath+" and with these query String params ",queryStringObject);
        // console.log("headers ", headers);
        // console.log("PAyload ", buffer);
        // res.end(`request made for ${trimmedPath} with ${method}\n`);



    }) 
})

 // start the server at port 3000
 server.listen(3000, ()=>{
     console.log("Server up on port 3000!");
 })
// ahndlers

var handlers = {};

handlers.sample = (data, callback) =>
{
    // callback an http status code and a payload object
    callback(406,{'name':'sample handler 406'});
};

handlers.notFound = (data, callback) =>
{
    callback(404);
};

//Routes


var router = {
    'sample' : handlers.sample 
}