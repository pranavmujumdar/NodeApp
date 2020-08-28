/* 
 * helpers for various tasks
 */

// Dependencies
const crypto = require('crypto');
const config = require('./config');
const { type } = require('os');

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

helpers.createRandomString = function(strLength){
  strLength = typeof(strLength)=='number' && strLength > 0 ? strLength : false;
  if(strLength){
    // define all the possible characters that go into the string
    var possibleCharacters = 'abcdefghijklmnopqrstuvwxyz0123456789';

    // start the string
    var str = '';
    for (i=1;i<strLength+1;i++){
      // get a random character from the possible characters
      var randomChr = possibleCharacters.charAt(Math.floor(Math.random()*possibleCharacters.length))
      // Append the character to the final string
      str +=randomChr;
    }
    // return the created string
    return str;
  }
  else{
    return false;
  }
}

// export the container
module.exports = helpers;