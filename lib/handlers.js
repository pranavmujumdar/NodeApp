/*
 *  Request handlers
 */


// Dependencies
const _data = require('./data');
const helpers = require('./helpers');
const config = require('./config');
const {
  time
} = require('console');
// Define the handlers 
var handlers = {};

handlers.users = (data, callback) => {
  var acceptableMethods = ['post', 'get', 'put', 'delete'];
  if (acceptableMethods.indexOf(data.method) > -1) {
    handlers._users[data.method](data, callback);
  } else {
    callback(405, 'Method not allowed');
  }
};

// Container for all hte CRUD methods for hte users
handlers._users = {};

// users POST
// firstName, lastName, phone, password, tosAgreement
// optional data: none
handlers._users.post = function (data, callback) {
  // check all required fields are filled out
  var firstName = typeof (data.payload.firstName) == 'string' && data.payload.firstName.trim().length > 0 ? data.payload.firstName.trim() : false;
  var lastName = typeof (data.payload.lastName) == 'string' && data.payload.lastName.trim().length > 0 ? data.payload.lastName.trim() : false;
  var phone = typeof (data.payload.phone) == 'string' && data.payload.phone.trim().length == 10 ? data.payload.phone.trim() : false;
  var password = typeof (data.payload.password) == 'string' && data.payload.password.trim().length > 0 ? data.payload.password.trim() : false;
  var tosAgreement = typeof (data.payload.tosAgreement) == 'boolean' && data.payload.tosAgreement == true ? true : false;

  if (firstName && lastName && phone && password && tosAgreement) {
    // Check existing user for similar phone number, must be unique
    _data.read('users', phone, function (err, data) {
      // if we get a read error it means user doesn't exist
      if (err) {
        //hash the password
        var hashedPassword = helpers.hash(password);
        if (hashedPassword) {
          // create the user object
          var userObject = {
            'firstName': firstName,
            'lastName': lastName,
            'phone': phone,
            'hashedPassword': hashedPassword,
            'tosAgreement': true
          };

          // store the user
          _data.create('users', phone, userObject, function (err) {
            if (!err) {
              callback(200);
            } else {
              console.log(err);
              callback(500, {
                'Error': 'Could not create a new password'
              })
            }
          })
        } else {
          callback(500, {
            'Error': 'Password couldn\'t be hashed'
          });
        }
      } else {
        //user exists
        callback(400, {
          'Error': 'User Exists'
        });
      }
    });
  } else {
    callback(400, {
      'Error': 'Missing required fields'
    })
  }

}

// users GET
// required : phone
// optional : none

handlers._users.get = function (data, callback) {
  // Check phone number is valid
  var phone = typeof (data.queryStringObject.phone) == 'string' && data.queryStringObject.phone.trim().length == 10 ? data.queryStringObject.phone : false;
  if (phone) {
    // get the token from the header
    var token = typeof (data.headers.token) == 'string' ? data.headers.token : false;
    // verify the token is valid
    handlers._tokens.isTokenValid(token, phone, function (tokenIsValid) {
      if (tokenIsValid) {
        _data.read('users', phone, function (err, data) {
          if (!err && data) {
            // remove the hashed password
            delete data.hashedPassword;
            callback(200, data);
          } else {
            callback(404, {
              'Error': 'User does not exist'
            });
          };
        });
      } else {
        callback(403, {
          'Error': 'Token Invalid or missing'
        })
      }
    });
  } else {
    callback(400, {
      'Error': 'Required phone number'
    })
  }
}

// users PUT
// required Data : phone
// Optional data : fname, lastName, password, at least one must be specified
handlers._users.put = function (data, callback) {
  // check for the required field
  var phone = typeof (data.payload.phone) == 'string' && data.payload.phone.trim().length == 10 ? data.payload.phone : false;
  // check for the optional fields
  var firstName = typeof (data.payload.firstName) == 'string' && data.payload.firstName.trim().length > 0 ? data.payload.firstName.trim() : false;
  var lastName = typeof (data.payload.lastName) == 'string' && data.payload.lastName.trim().length > 0 ? data.payload.lastName.trim() : false;
  var password = typeof (data.payload.password) == 'string' && data.payload.password.trim().length > 0 ? data.payload.password.trim() : false;

  // error if the phone is invalid
  if (phone) {
    //error if nothing is sent to update
    if (firstName || lastName || phone) {

      // get the token from the header
      var token = typeof (data.headers.token) == 'string' ? data.headers.token : false;

      // verify the token is valid
      handlers._tokens.isTokenValid(token, phone, function (tokenIsValid) {
        if (tokenIsValid) {
          // read the user based off of the phone number
          _data.read('users', phone, function (err, data) {
            if (!err && data) {
              //proceed with the request
              if (firstName) {
                data.firstName = firstName;
              }
              if (lastName) {
                data.lastName = lastName;
              }
              if (password) {
                data.hashedPassword = helpers.hash(password);
              }
              // Store the new object to the disk
              _data.update('users', phone, data, function (err) {
                if (!err) {
                  callback(200);
                } else {
                  console.log(err);
                  callback(500, {
                    'Error': 'Could not update the record'
                  });
                }
              })
            } else {
              callback(400, {
                'Error': 'User Not Found'
              })
            }
          })
        } else {
          callback(403, {
            'Error': 'Token Invalid or missing'
          })
        }
      });
    } else {
      callback(400, {
        'Error': 'Missing fields to update'
      });
    }
  } else {
    callback(400, {
      'Error': 'missing phone number for PUT'
    });
  }

}
// users DELETE
// required phone 
handlers._users.delete = function (data, callback) {
  // Check phone number is valid
  var phone = typeof (data.queryStringObject.phone) == 'string' && data.queryStringObject.phone.trim().length == 10 ? data.queryStringObject.phone : false;
  if (phone) {
    // get the token from the header
    var token = typeof (data.headers.token) == 'string' ? data.headers.token : false;
    // verify the token is valid
    handlers._tokens.isTokenValid(token, phone, function (tokenIsValid) {
      if (tokenIsValid) {
        _data.read('users', phone, function (err, userData) {
          if (!err && userData) {
            _data.delete('users', phone, function (err) {
              if (!err) {
                // Delete the checks associated with the user
                var userChecks = typeof (userData.checks) == 'object' && userData.checks instanceof Array ? userData.checks : [];
                var userChecksToDelete = userChecks.length;
                if(userChecksToDelete > 0){
                  var checksDeleted = 0;
                  var deletionErrors = false;

                  userChecks.forEach(function(checkID){
                    _data.delete('checks', checkID, function(err){
                      if(err){
                        deletionErrors = true;
                      }
                      checksDeleted ++;
                      if(checksDeleted == userChecksToDelete){
                        if(!deletionErrors){
                          callback(200);
                        }
                        else
                        {
                          callback(500, {'Error':'Can\'t Delete checks associated with the user'});
                        }
                      }
                    })
                  })
                }
                else{
                  callback(200);
                }
              } else {
                callback(500, {
                  'Error': 'could not delete the user'
                })
              }
            })
          } else {
            callback(400, {
              'Error': 'User does not exist'
            });
          }
        })
      } else {
        callback(403, {
          'Error': 'Token Invalid or missing'
        })
      }
    });
  } else {
    callback(400, {
      'Error': 'Required phone number'
    })
  }
}

// token handlers
handlers.tokens = (data, callback) => {
  var acceptableMethods = ['post', 'get', 'put', 'delete'];
  if (acceptableMethods.indexOf(data.method) > -1) {
    handlers._tokens[data.method](data, callback);
  } else {
    callback(405, 'Method not allowed');
  }
};

// Container for all the tokens
handlers._tokens = {};

// tokens post
// Required data : Phone And password
// Optional Data : none
handlers._tokens.post = function (data, callback) {
  var phone = typeof (data.payload.phone) == 'string' && data.payload.phone.trim().length == 10 ? data.payload.phone.trim() : false;
  var password = typeof (data.payload.password) == 'string' && data.payload.password.trim().length > 0 ? data.payload.password.trim() : false;
  if (phone && password) {
    _data.read('users', phone, function (err, userData) {
      if (!err && userData) {
        // Hash the sent password, compare it to the password stored in the user object
        var hashedPassword = helpers.hash(password);
        if (hashedPassword == userData.hashedPassword) {
          // if valid, create a new token with a random name, set expiration data one hour
          var tokenId = helpers.createRandomString(20);
          var expires = Date.now() + (1000 * 60 * 60);
          var tokenObject = {
            'phone': phone,
            'id': tokenId,
            'expires': expires
          }

          // store the token
          _data.create('tokens', tokenId, tokenObject, function (err) {
            if (!err) {
              callback(200, tokenObject)
            } else {
              callback(500, {
                'Error': 'can\'t create the token'
              })
            }
          })
        } else {
          callback(400, {
            'Error': ' Wrong password'
          });
        }

      } else {
        callback(400, {
          'Error': 'User don\'t exist mf'
        })
      }
    });
  } else {
    callback(400, {
      'error': 'Missing Required Fields'
    })
  }
};

// Tokens get 
// Required Data : Token ID
// Optional Data : None
handlers._tokens.get = function (data, callback) {
  // Check Token Id is valid
  var id = typeof (data.queryStringObject.id) == 'string' && data.queryStringObject.id.trim().length == 20 ? data.queryStringObject.id : false;
  if (id) {
    _data.read('tokens', id, function (err, tokenData) {
      if (!err && tokenData) {
        callback(200, tokenData);
      } else {
        callback(404, {
          'Error': 'Token does not exist'
        });
      }
    })
  } else {
    callback(400, {
      'Error': 'Required Token number'
    })
  }
};
// Tokens Delete
// Required Data : id
//
handlers._tokens.delete = function (data, callback) {
  var id = typeof (data.queryStringObject.id) == 'string' && data.queryStringObject.id.trim().length == 20 ? data.queryStringObject.id : false;
  if (id) {
    _data.read('tokens', id, function (err, tokenData) {
      if (!err && tokenData) {
        _data.delete('tokens', id, function (err) {
          if (!err) {
            callback(200, tokenData);
          } else {
            callback(500, {
              'Error': 'could not delete the token'
            })
          }
        })
      } else {
        callback(400, {
          'Error': 'token does not exist'
        });
      }
    })
  } else {
    callback(400, {
      'Error': 'Required token number'
    })
  }
};

// Tokens put
// We can only extend the token expiration
// only allow to extend for one hour
// required : id, extend(bool)
handlers._tokens.put = function (data, callback) {
  var id = typeof (data.payload.id) == 'string' && data.payload.id.trim().length == 20 ? data.payload.id.trim() : false;
  var extend = typeof (data.payload.extend) == 'boolean' && data.payload.extend == true ? true : false;
  if (id && extend) {
    // look up the token
    _data.read('tokens', id, function (err, tokenData) {
      if (!err && tokenData) {
        // check if token is expired
        if (tokenData.expires > Date.now()) {
          // Set the expiry to one hour from now
          tokenData.expires = Date.now() + (1000 * 60 * 60);

          // Store the new update to tokens collection and file
          _data.update('tokens', id, tokenData, function (err) {
            if (!err) {
              callback(200, tokenData)
            } else {
              callback(500, {
                'Error': 'Error updating the token\'s Expiration'
              })
            }
          })
        } else {
          callback(400, {
            'Error': 'token expired'
          });
        }
        //
      } else {
        callback(400, {
          'error': 'error finding the token'
        });
      }
    })
  } else {
    callback(400, {
      'Error': 'Missing required Fields, or '
    })
  }
};

// Verify if token isValid
handlers._tokens.isTokenValid = function (id, phone, callback) {
  // lookup the token
  _data.read('tokens', id, function (err, tokenData) {
    if (!err && tokenData) {
      // check if token is for the phone number and not expired
      if (tokenData.phone == phone && tokenData.expires > Date.now()) {
        callback(true);
      } else {
        callback(false);
      }
    } else {
      callback(false)
    }
  })
}

// Checks handler

// token handlers
handlers.checks = (data, callback) => {
  var acceptableMethods = ['post', 'get', 'put', 'delete'];
  if (acceptableMethods.indexOf(data.method) > -1) {
    handlers._checks[data.method](data, callback);
  } else {
    callback(405, 'Method not allowed');
  }
};

// Container for all the tokens
handlers._checks = {};

// Checks POST
// required data: protocol, url, method, successCodes, timeoutSeconds
// optional data : None
handlers._checks.post = function (data, callback) {
  // validate inputs
  var protocol = typeof (data.payload.protocol) == 'string' && ['http', 'https'].indexOf(data.payload.protocol.trim()) > -1 ? data.payload.protocol.trim() : false;
  var url = typeof (data.payload.url) == 'string' && data.payload.url.trim().length > 0 ? data.payload.url.trim() : false;
  var method = typeof (data.payload.method) == 'string' && ['get', 'post', 'put', 'delete'].indexOf(data.payload.method.trim()) > -1 ? data.payload.method.trim() : false;
  var successCodes = typeof (data.payload.successCodes) == 'object' && data.payload.successCodes instanceof Array && data.payload.successCodes.length > 0 ? data.payload.successCodes : false;
  var timeOutSeconds = typeof (data.payload.timeOutSeconds) == 'number' && data.payload.timeOutSeconds % 1 === 0 && data.payload.timeOutSeconds >= 1 && data.payload.timeOutSeconds <= 5 ? data.payload.timeOutSeconds : false;

  if (protocol && url && method && successCodes && timeOutSeconds) {
    // Get the token from the headers 
    var token = typeof (data.headers.token) == 'string' ? data.headers.token : false;
    //lookup user and match the token
    _data.read('tokens', token, function (err, tokenData) {
      if (!err && tokenData) {
        var userPhone = tokenData.phone;

        // lookup the user
        _data.read('users', userPhone, function (err, userData) {
          if (!err && userData) {
            var userChecks = typeof (userData.checks) == 'object' && userData.checks instanceof Array ? userData.checks : [];
            // verify user has less than maxChecks pre user
            if (userChecks.length <= config.maxChecks) {
              // create a random id for checks
              var checkID = helpers.createRandomString(20);

              // Create check object and include user's phone number
              var checkObject = {
                'id': checkID,
                'userPhone': userPhone,
                'protocol': protocol,
                'url': url,
                'method': method,
                'successCodes': successCodes,
                'timeOutSeconds': timeOutSeconds
              };

              // save the object to disk
              _data.create('checks', checkID, checkObject, function (err) {
                if (!err) {
                  // add the check id to the user's object
                  userData.checks = userChecks;
                  userData.checks.push(checkID);

                  // save the new user data 
                  _data.update('users', userPhone, userData, function (err) {
                    if (!err) {
                      // return the data about the new check
                      callback(200, checkObject);
                    } else {
                      callback(500, {
                        'Error': 'Could not associate the check with the user'
                      })
                    }
                  })
                } else {
                  callback(500, {
                    'Error': 'Could not create the check'
                  })
                }
              })
            }
          } else {
            callback(400, {
              'Error': 'User has already maximum checks (' + config.maxChecks + ')'
            })
          }
        })
      } else {
        callback(403, {
          'Error': 'Token Invalid'
        });
      }
    })
  } else {
    callback(400, {
      'Error': 'Invalid inputs for checks'
    });
  }
}

handlers._checks.get = (data, callback) => {
  // Check if check id is valid
  var id = typeof (data.queryStringObject.id) == 'string' && data.queryStringObject.id.trim().length == 20 ? data.queryStringObject.id : false;
  if (id) {
    // Look up the check
    _data.read('checks', id, function (err, checkData) {
      if (!err && checkData) {
        // get the token from the header
        var token = typeof (data.headers.token) == 'string' ? data.headers.token : false;
        // verify the token is valid and belongs to the user who created the check
        handlers._tokens.isTokenValid(token, checkData.userPhone, function (tokenIsValid) {
          if (tokenIsValid) {
            // Return the check data
            callback(200, checkData);
          } else {
            callback(403, {
              'Error': 'Token Invalid or missing'
            })
          }
        });
      } else {
        callback(404, {
          'Error': 'check not found'
        });
      }
    })
  } else {
    callback(400, {
      'Error': 'Required check id'
    })
  }
}

// Checks PUT request
// Required Data : check ID
// Optional Data :protocol, url, method, successCodes, timeOutSeconds(at least one must be sent )
handlers._checks.put = (data, callback) => {
  var id = typeof (data.payload.id) == 'string' && data.payload.id.trim().length == 20 ? data.payload.id : false;
  // check for the optional fields
  var protocol = typeof (data.payload.protocol) == 'string' && ['http', 'https'].indexOf(data.payload.protocol.trim()) > -1 ? data.payload.protocol.trim() : false;
  var url = typeof (data.payload.url) == 'string' && data.payload.url.trim().length > 0 ? data.payload.url.trim() : false;
  var method = typeof (data.payload.method) == 'string' && ['get', 'post', 'put', 'delete'].indexOf(data.payload.method.trim()) > -1 ? data.payload.method.trim() : false;
  var successCodes = typeof (data.payload.successCodes) == 'object' && data.payload.successCodes instanceof Array && data.payload.successCodes.length > 0 ? data.payload.successCodes : false;
  var timeOutSeconds = typeof (data.payload.timeOutSeconds) == 'number' && data.payload.timeOutSeconds % 1 === 0 && data.payload.timeOutSeconds >= 1 && data.payload.timeOutSeconds <= 5 ? data.payload.timeOutSeconds : false;

  // error if the id is valid
  if (id) {
    //check if nothing is sent to update
    if (protocol || url || method || successCodes || timeOutSeconds) {
      // See if the check exists
      _data.read('checks', id, function (err, checkData) {
        if (!err && checkData) {
          // get the token from the header
          var token = typeof (data.headers.token) == 'string' ? data.headers.token : false;
          // verify if the token is valid for the user who created the check
          handlers._tokens.isTokenValid(token, checkData.userPhone, function (tokenIsValid) {
            if (tokenIsValid) {
              _data.read('checks', id, function (err, checkData) {
                if (!err && checkData) {
                  // proceed with putting new values
                  if (protocol) {
                    checkData.protocol = protocol;
                  }
                  if (url) {
                    checkData.url = url;
                  }
                  if (successCodes) {
                    checkData.successCodes = successCodes;
                  }
                  if (timeOutSeconds) {
                    checkData.timeOutSeconds = timeOutSeconds;
                  }
                  // update the check record
                  _data.update('checks', id, checkData, function (err) {
                    if (!err) {
                      callback(200);
                    } else {
                      callback(500, {
                        'error': 'cannot update the check'
                      });
                    }
                  })
                } else {
                  callback(500, {
                    'Error': 'Error reading the check data'
                  })
                }
              })
            } else {
              callback(403, {
                'Error': 'Token Invalid or missing'
              });
            }
          })
        } else {
          callback(404, {
            'Error': 'Check not found'
          });
        }
      })
    } else {
      callback(400, {
        'Error': 'Missing fields to make updates in the check'
      });
    }
  } else {
    callback(400, {
      'Error': 'missing Check ID for PUT'
    });
  }
}

// Checks Delete Handler
// Required Data : check ID
handlers._checks.delete = (data, callback) => {
  // Check check ID is valid
  var id = typeof (data.queryStringObject.id) == 'string' && data.queryStringObject.id.trim().length == 20 ? data.queryStringObject.id : false;
  if (id) {
    //check if the check is valid
    _data.read('checks', id, function (err, checkData) {
      if (!err && checkData) {
        // get the token from the header
        var token = typeof (data.headers.token) == 'string' ? data.headers.token : false;
        // verify the token is valid
        handlers._tokens.isTokenValid(token, checkData.userPhone, function (tokenIsValid) {
          if (tokenIsValid) {
            // Delete the check
            _data.delete('checks', id, function (err) {
              if (!err) {
                // check is deleted from the record need to delete it from the user's array
                _data.read('users', checkData.userPhone, function (err, userData) {
                  if (!err && userData) {
                    var userChecks = typeof (userData.checks) == 'object' && userData.checks instanceof Array ? userData.checks : [];
                    // remove the deleted check from the list of checks
                    var checkPosition = userChecks.indexOf(id);
                    if (checkPosition > -1) {
                      // remove the check from the list
                      userChecks.splice(checkPosition, 1);
                      // Save the list once again
                      _data.update('users', checkData.userPhone, userData, function (err) {
                        if (!err) {
                          // return 200
                          callback(200);
                        } else {
                          callback(500, {
                            'Error': 'Could not update the user'
                          });
                        }
                      })
                    } else {
                      callback(500, {
                        'Error': 'Could not find the check on the user'
                      });
                    }
                  } else {
                    callback(500, {
                      'Error': 'Could Not find the user to delete their Checks'
                    });
                  }
                })
              } else {
                callback(500, {
                  'Error': 'Error Deleting the check'
                });
              }
            })
          } else {
            callback(403, {
              'Error': 'Invalid token'
            });
          }
        })
      } else {
        callback(404, {
          'Error': 'Check Not Found'
        });
      }
    })
  }
}

// ping Handler
handlers.ping = (data, callback) => {
  // callback an http status code and a payload object
  callback(200);
};
// default to notFound
handlers.notFound = (data, callback) => {
  callback(404);
};

// Export the Handlers modules
module.exports = handlers;