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


// List all the logs and optionally include compressed logs
lib.list = function(includeCompressedLogs, callback){
  fs.readdir(lib.baseDir, function(err, data){
    if(!err && data && data.length > 0){
      let trimmedFileNames = [];
      data.forEach(function(fileName){
        // Add the log files
        if(fileName.indexOf('.log')> -1){
          trimmedFileNames.push(fileName.replace('.log',''));
        }
        // Add on the .gz base 64
        if(fileName.indexOf('.gz.b64')>-1 && includeCompressedLogs){
          trimmedFileNames.push(fileName.replace('.gz.b64',''));
        }
      });
      callback(false, trimmedFileNames);
    }
    else{
      callback(err, data)
    }
  })
} 

// Lib compress log file for gz.b64

lib.compress = function(logId, newFileId, callback){
  var sourceFile = logId + '.log';
  var destFile = newFileId+'.gz.b64';

  // Read the source File
  fs.readFile(lib.baseDir+sourceFile,'utf8', function(err, inputString){
    if(!err && inputString){
      // compress the data using
       zlib.gzip(inputString, function(err, buffer){
         if(!err && buffer){
          // Send the data to the new destination file
          fs.open(lib.baseDir+destFile, 'wx', function(err, fd){
            if(!err && fd){
              fs.writeFile(fd,buffer.toString('base64'), function(err){
                if(!err){
                  // close the file
                  fs.close(fd, function(err){
                    if(!err){
                      callback(false);
                    }
                    else{
                      callback(err);
                    }
                  });
                }
                else{
                  callback(err);
                }
              })
            }
            else{
              callback(err);
            }
          })
         }
         else{
           callback(err);
         }
       })
    }
    else{
      callback(err);
    }
  })
}

// Decompress the gz.b64 to a string
lib.decompress = function(fileId, callback){
  var fileName = fileId + '.gz.b64';
  fs.readFile(lib.baseDir+fileName, 'utf-8',function(err,str){
    if(!err && str){
      // decompress the data
      var inputBuffer = Buffer.from(str, 'base64');
      zlib.unzip(inputBuffer, function(err, outputBuffer){
        if(!err && outputBuffer){
          // callback 
          var str = outputBuffer.toString();
          callback(false, str);
        }
        else{
          callback(err);
        }
      })
    }
    else{
      callback(err);
    }
  });
}

// truncate the log files
lib.truncate = function(logId, callback){
  fs.truncate(lib.baseDir+logId+'.log',0,function(err){
    if(!err){
      callback(false);
    }
    callback(err);
  })
}

// export the lib module
module.exports = lib;
