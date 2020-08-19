/**
 * index for the api
 * 
 */

 // Dependancies
 const http = require('http');

 // 
const server = http.createServer(function(req, res){
    res.end("Hello!")
})
 // start the server at port 3000
 server.listen(3000, ()=>{
     console.log("Server up!");
 })