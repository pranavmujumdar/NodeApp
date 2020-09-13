/* 
 * Library for storing and rotating logs 
 */

 // Dependencies
const fs = require('fs');
const path = require('path');
const zlib = require('zlib');

// Container for the module
const lib = {};

// base directory of the logs folder
lib.baseDir = path.join(__dirname, '/../.logs/');

// Append the string to the file, Create if doesn't exist.
lib.append = function(fileName, str, callback){
  // open the file for appending
  fs.open(lib.baseDir + fileName + '.log', 'a', function(err, fileDescriptor){
    if(!err && fileDescriptor){
      // Append to the file and close
      fs.appendFile(fileDescriptor, str+'\n', function(err){
        if(!err){
          fs.close(fileDescriptor, function(err){
            if(!err){
              callback(false);
            }
            else{
              callback('Could not close the file')
            }
          })
        }
        else{
          callback('error appending the file!')
        }
      })
    }
    else{
      callback('Could not open the log file for appending')
    }
  })
}

// export the lib module
module.exports = lib;
