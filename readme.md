## Node RESTful api for uptime monitoring application

## Functionalities:
* Users can enter a url they want to monitor and receive text alerts when the url goes down or is back online
* sign up and sign in features
* Twilio API to trigger text messages on state change (please create account and get auth token from https://www.twilio.com/ and edit the config.js file accordingly )

## API Specifications
1. Accepts CRUD requests
2. API allows client connection for user CRUD
3. Token management and authentication for sign in
4. Invalidate token on Sign out
5. Signed in user can add URL to checks
6. Signed in user can edit delete checks
7. keep monitoring the urls every minute and create alerts on state change(i.e. up or down)

## Temporarily stored in file system rather than a database

## All the Requests
### 1. Users http://localhost:3000/users
    GET: Get the users checks and info
    
    * Required Params 
    
    1. qString: phone
    2. Headers: token
    
    POST: Create a user
    
    * Required Params 
    
    Body: 
    
    ```javascript
            'firstName': String,
            'lastName': String,
            'phone': Number, //must be equal to 10
            'password': String, 
            'tosAgreement': true //true or false only create user if true
    ```

    PUT: Change the user's first name or last name or password

    * Required Params 

    1. Headers: token id
    2. Body:
    ```javascript
            'firstName': String, // optional
            'lastName': String, // optional
            'phone': Number, // Required
            'password': String, // Password to be changed
    ```
    DELETE: Delete the user

    * Required Params 
    
    1. qString: phone
    2. Headers: token

### 2. Tokens http://localhost:3000/tokens
    GET: Get the token and it's associated account, and it's expiry
    
    * Required Params 
    
    1. qString: token id
    
    POST: Create a token for a user
    
    * Required Params 
    
    Body: 
    
    ```javascript
            'phone': Number, //must be equal to 10
            'password': String, 
    ```

    PUT: Extend the token expiry by a predefined time

    * Required Params 

    1. Body:
    ```javascript
            'tokenId': String, // optional
            'extends': true, // optional
    ```
    DELETE: Delete the Toke

    * Required Params 
    
    1. qString: tokenId


### 3. Checks http://localhost:3000/checks
    GET: Get the check info
    
    * Required Params 
    
    1. Headers: token id
    2. qString: check id
    
    POST: Create a check for a user
    
    * Required Params 
    1. Headers: Token id
    2. Body: 

    ```javascript
      'id': checkID,
      'userPhone': userPhone,
      'protocol': protocol,
      'url': url,
      'method': method,
      'successCodes': successCodes,
      'timeOutSeconds': timeOutSeconds
    ```

    PUT: Modify the check attributes 

    * Required Params 
    1. Headers: Token id
    2. Body:
    ```javascript
      'id': checkID, // Required
      'protocol': protocol, // optional
      'url': url, //optional
      'method': method, //optional
      'successCodes': successCodes, //optional
      'timeOutSeconds': timeOutSeconds //optional
    ```
    DELETE: Delete the Check

    * Required Params 
    
    1. qString: Check id
    2. Headers: Token id