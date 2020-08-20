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

