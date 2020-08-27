/**
 * Library for storing and editing the data
 */

 const fs = require('fs');
 const path = require('path');

 // Container for the module to export
var lib = {};
// base directory of the data folder
lib.baseDir = path.join(__dirname, '/../.data/')
lib.create = function(dir,file,data,callback){
    //open the file for writing
    fs.open(lib.baseDir+dir+'/'+file+'.json', 'wx', function(error, fileDescriptor){
        if(!error && fileDescriptor){
            // Convert data to string
            var stringData = JSON.stringify(data);

            // write the data to file and close it
            fs.writeFile(fileDescriptor, stringData, function(error){
                if(!error){
                    fs.close(fileDescriptor, function(error){
                        if(!error){
                            callback(false);
                        }
                        else{
                            callback('error closing the new file');
                        }
                    });
                }
                else{
                    callback('Error Writing to the new file');
                }
            });
        } 
        else {
            callback('Could not create a new file, it may already open')
        }
    });
}
// read a file
lib.read = function (dir,file,callback){
    fs.readFile(lib.baseDir+dir+'/'+file+'.json', 'utf-8', function(error, data){
        callback(error,data);
    })
};

// read and update a file
lib.update = function(dir, file, data, callback){
    // open the file for writing
    fs.open(lib.baseDir+dir+'/'+file+'.json', 'r+', function(err,fileDescriptor){
        if(!err && fileDescriptor){
            var stringData = JSON.stringify(data);

            // truncate the file
            fs.ftruncate(fileDescriptor, function(error){
                if(!error){
                    // write to the file and close
                    fs.writeFile(fileDescriptor, stringData, function(error){
                        if(!error){
                            fs.close(fileDescriptor, function(error){
                                if(!error){
                                    callback(false);
                                }
                                else{
                                    callback('error closing the file');
                                }
                            })
                        }
                        else{
                            callback('error writing the existing file');
                        }
                    })
                }   
                else{
                    callback('Error truncating')
                }
            })
        }
        else{
            callback('Could not open the file, may not exist');
        }
    })
}


lib.delete = function (dir, file, callback){
  //unlinking the file from the file system
  fs.unlink(lib.baseDir+dir+'/'+file+'.json', function(err){
      if(!err){
          callback(false);
      }
      else{
          callback('Error deleting',err);
      }
  })  
};
 // export the module
 module.exports = lib;