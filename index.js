/**
 * index for the api
 * 
 */

 // Dependancies
 const http = require('http');
 const url = require("url");

 // 
const server = http.createServer((req, res)=>{
    // get the url
    var parsedUrl = url.parse(req.url, true);
    // get the path
    var path = parsedUrl.pathname;
    var trimmedPath = path.replace(/^\/+|\/+$/g,'');
    // send the response
    console.log("Hello");
    // log the request
    console.log("request receieved on path "+trimmedPath);
})
 // start the server at port 3000
 server.listen(3000, ()=>{
     console.log("Server up!");
 })