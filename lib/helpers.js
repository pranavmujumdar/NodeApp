/* 
 * helpers for various tasks
 */

// Dependencies
const crypto = require('crypto');
const config = require('./config');

// Container for all the helpers
const helpers = {};

// create a SHA256 hash
helpers.hash = function(str){
  if(typeof(str)=='string' && str.length > 0){
    var hash = crypto.createHmac('sha256', config.hashingSecret).update(str).digest('hex');
    return hash;
  }
  else {
    return false;
  }
}

// Create JSON string to an object from data
helpers.parseJsonToObject = function(str){
  try{
    var object = JSON.parse(str);
    return object;
  }
  catch(e){
    return {};
  }
}



// export the container
module.exports = helpers;