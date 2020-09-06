/* 
 * helpers for various tasks
 */

// Dependencies
const crypto = require('crypto');
const config = require('./config');
var https = require('https');
const queryString = require('querystring');

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

// Twilio SMS API helper
helpers.sendTwilioSms = function(phone,msg,callback){
  // validate the inputs
  phone = typeof(phone) == 'string' && phone.trim().length == 10 ? phone : false;
  msg = typeof(msg) == 'string' && msg.trim().length > 0 &&  msg.trim().length <= 160 ? msg :false;
  if(phone && msg){
    // Inputs valid lets communicate with Twillio
    var payload = {
      'From' : config.twilio.fromPhone,
      'To' : '+1'+phone,
      'Body' : msg
    };

    //  stringify in querystring
    var stringPayload = queryString.stringify(payload);

    // configure the api request

    var requestDetails = {
      'protocol' :'https:',
      'hostname' :'api.twilio.com',
      'method' :'POST',
      'path' : '/2010-04-01/Accounts/'+config.twilio.accountSid+'/Messages.json',
      'auth' : config.twilio.accountSid+':'+config.twilio.authToken,
      'headers' : {
        'Content-Type' : 'application/x-www-form-urlencoded',
        'Content-Length' : Buffer.byteLength(stringPayload)
      }
    };

    // Create the HTtps request
    var req = https.request(requestDetails, function(res){
      // Grab the status of the request
      var status = res.statusCode;
      // callback successfully if the request went through
      if(status == 200 || status == 201){
        callback(false);
      }
      else{
        callback('Status code returned from twilio was'+status);
      }
    });

    // Bind the err to the req
    req.on('error', function(e){
      callback(e);
    });

    // Add the payload to the request
    req.write(stringPayload);

    // End the request
    req.end();


  }
  else
  {
    callback('Given inputs missing or invalid');
  }
}
// export the container
module.exports = helpers;