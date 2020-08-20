/**
 * index for the api
 * 
 */

 // Dependancies
 const http = require('http'); //for handling the http requests
 const url = require("url"); // for getting the url and it's path

 // 
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

    // send the response
    console.log("Hello");
    
    // log the request
    console.log("request receieved on path "+ trimmedPath+" and with these query String params ",queryStringObject);
    res.end(`request made for ${trimmedPath} with ${method}\n`);
})
 // start the server at port 3000
 server.listen(3000, ()=>{
     console.log("Server up on port 3000!");
 })