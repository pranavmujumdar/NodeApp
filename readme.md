## Node RESTful api for uptime monitoring application

## Functionalities:
* Users can enter a url they want to monitor and receive text alerts when the url goes down or is back online
* sign up and sign in features

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
1. Users http://localhost:3000/users
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
