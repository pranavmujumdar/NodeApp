/*
 * Worker Tasks
 */

// Dependencies
const path = require('path');
const fs = require('fs');
const _data = require('./data');
const https = require('https');
const http = require('https');
const helpers = require('./helpers');
const url = require('url');
const config = require('./config');

// Instantiate the object
var workers = {};

// Sanity check the data
workers.validateCheckData = function(originalCheckData){
  //console.log('Validate check called');
  originalCheckData = typeof(originalCheckData) == 'object' && originalCheckData !== null ? originalCheckData : {};
  originalCheckData.id = typeof(originalCheckData.id) == 'string' && originalCheckData.id.trim().length == 20 ? originalCheckData.id.trim() : false;
  originalCheckData.userPhone = typeof(originalCheckData.userPhone) == 'string' && originalCheckData.userPhone.trim().length == 10 ? originalCheckData.userPhone.trim() : false;
  originalCheckData.protocol = typeof(originalCheckData.protocol) == 'string' &&  ['http', 'https'].indexOf(originalCheckData.protocol.trim()) > -1 ? originalCheckData.protocol.trim() : false;
  originalCheckData.url = typeof(originalCheckData.url) == 'string' && originalCheckData.url.trim().length > 0 ?  originalCheckData.url.trim() : false;
  originalCheckData.method = typeof(originalCheckData.method) == 'string' &&  ['get','post','put','delete'].indexOf(originalCheckData.method.trim()) > -1 ? originalCheckData.method.trim() : false;
  originalCheckData.successCodes = typeof(originalCheckData.successCodes) == 'object' && originalCheckData.successCodes instanceof Array && originalCheckData.successCodes.length > 0 ?  originalCheckData.successCodes : false;
  originalCheckData.timeOutSeconds = typeof (originalCheckData.timeOutSeconds) == 'number' && originalCheckData.timeOutSeconds % 1 === 0 && originalCheckData.timeOutSeconds >= 1 && originalCheckData.timeOutSeconds <= 5 ? originalCheckData.timeOutSeconds : false;

  // Set the keys added by workers
  originalCheckData.state = typeof(originalCheckData.state) == 'string' &&  ['up', 'down'].indexOf(originalCheckData.state.trim()) > -1 ? originalCheckData.state.trim() : 'down';
  originalCheckData.lastChecked = typeof (originalCheckData.lastChecked) == 'number' && originalCheckData.lastChecked > 0 ? originalCheckData.lastChecked : false;

  // if all the checks are passed, pass it along to the next process
  if(
    originalCheckData.id &&
    originalCheckData.userPhone &&
    originalCheckData.protocol &&
    originalCheckData.url &&
    originalCheckData.method &&
    originalCheckData.successCodes &&
    originalCheckData.timeOutSeconds
  ){
    // console.log('check validated and into perform check ');
    workers.performCheck(originalCheckData);
  }
  else {
    console.log('Error, One of the check is not properly formatted skipping the check');
  }
}
// PerformCheck, get the original checkdata, get outcome of the check
workers.performCheck = function(originalCheckData){
  // Prepare the initial check outcome 
  
  var checkOutcome = {
    'error' : false,
    'responseCode' : false
  };

  // mark that the outcome is not sent yet
  var outcomeSent = false;

  // parse the hostname and the path from the check data
  var parsedUrl = url.parse(originalCheckData.protocol+'://'+originalCheckData.url, true);
  var hostName = parsedUrl.hostname;
  var path = parsedUrl.path;

  // construct the request

  var requestDetails = {
    'protocol' :  originalCheckData.protocol + ':',
    'hostname' : hostName,
    'method' :  originalCheckData.method.toUpperCase(),
    'path' : path,
    'timeOut' : originalCheckData.timeOutSeconds * 1000
  };

  // Instantiate the request using http or https module
  var _moduleToUse = originalCheckData.protocol == 'http' ? http : https;
  var req = _moduleToUse.request(requestDetails, function(res){
    // Grab the status of the request
    var status = res.statusCode;

    // Update the outcome to the checkdata
    checkOutcome.responseCode = status;
    if(!outcomeSent){
      workers.processCheckOutcome(originalCheckData, checkOutcome);
      outcomeSent = true;
    }
  });
  // Bind to the error event so it doesn't get thrown
  req.on('error', function(e){
    checkOutcome.error = {
      'error' : true,
      'value' : e
    };
    if(!outcomeSent){
      workers.processCheckOutcome(originalCheckData, checkOutcome);
      outcomeSent = true;
    }
  });

  // Bind the timeout 
  req.on('timeout', function(e){
    checkOutcome.error = {
      'error' : true,
      'value' : 'timeout'
    };
    if(!outcomeSent){
      workers.processCheckOutcome(originalCheckData, checkOutcome);
      outcomeSent = true;
    }
  });

  // End the request
  req.end();


};

// Process the check outcome , update the check data as needed, trigger the alert if needed,
// Special Logic, first time doesn't trigger alert

workers.processCheckOutcome = function(originalCheckData, checkOutcome){
  // decide if the check is up or down currently 
  var state = !checkOutcome.error && checkOutcome.responseCode && originalCheckData.successCodes.indexOf(checkOutcome.responseCode)>-1 ? 'up': 'down';

  // Decide if alert is warranted
  var alertWarranted = originalCheckData.lastChecked  && originalCheckData.state !== state ? true : false;

  // Update the check Data
  var newCheckData = originalCheckData;
  newCheckData.state = state;
  newCheckData.lastChecked = Date.now();

  // Save the updates 
  _data.update('checks', newCheckData.id, newCheckData, function(err){
    if(!err){
      // Send the check to the next step
      if(alertWarranted){
        workers.alertUserToStatusChange(newCheckData);
      }
      else
      {
        console.log('No State change; No alert needed');
      }
    }
    else
    {
      console.log('Error updating the check');
    }
  });
};

// Alert the user with the status change
workers.alertUserToStatusChange = function(newCheckData){
  let msg = 'Alert: Your Check for '+newCheckData.method.toUpperCase()+' ' + newCheckData.protocol + '://' +newCheckData.url+ ' is currently ' + newCheckData.state;
  helpers.sendTwilioSms(newCheckData.userPhone, msg, function(err){
    if(!err){
      console.log('Success : User was alerted for the check status change', msg);
    }
    else{
      console.log('Error : Could not alert the user for the check status change', msg);
    }
  })
};

workers.gatherAllChecks = function(){
  // get all the checks 
  //console.log('Gather called');
  _data.list('checks', function(err,checks){
    if(!err && checks && checks.length > 0)
    {
      checks.forEach(function(check){
        _data.read('checks', check, function(err, originalCheckData){
          if(!err && originalCheckData){
            // pass data to validator
            workers.validateCheckData(originalCheckData);
          }
          else{
            console.log('Error reading the checkdata')
          }
        });
      });
    }
    else
    {
      console.log('Error : No checks found')
    }
  })
}
// Timer to execute the workers per minute
workers.loop = function(){
  setInterval(function(){
    console.log('Loop called');
    workers.gatherAllChecks(); // gather all the checks every interval
  },config.loopIntervalForWorkers)
}

workers.init = function (){
  //console.log('Init Workers called')
  // Execute the checks
  workers.gatherAllChecks();
  // Call the loop so the checks will continue automatically
  workers.loop();
}
// Export the object
module.exports = workers;

