# Appcelerator Arrow Authentication through Github
Appcelerator Github Auth utilizes [github.com](https://github.com) API to authorize application requests.

### The module uses
* [passport](http://passportjs.org/)
* [passport-github](https://github.com/jaredhanson/passport-github)

### Authentication flow

*   User visits the application
*   The module checks if the user is logged in
*   If not authenticated, the user is redirected to loginUrl, which you have to set (see point 3.1.).
*   From the login route the user is redirected to Github
    *   **On success** - github returns the user to the callbackUrl (see point 2.1. - configuration options)
    *   **On error** - user is redirected to the callbackUrl as well
*   The module grab data sent from github, writes it and makes it accessible trough the application request object (see point 3.4.)
    

## 1.   Installation
* Install the module
    ```> npm install appcgithubauth```
* Update your configuration file `conf/default.js`
```
APIKeyAuthType: 'plugin', // Modify the default 'APIKeyAuthType', and set it to 'plugin'
APIKeyAuthPlugin: 'appcgithubauth' 
```


## 2.  Configuration
 
 The full plugin configuration is added at root level in you `conf/default.js` file:

```
githubAuth: {
		clientID: '***', // github client ID
		clientSecret: '***',//github client secret
		callbackURL: "***",//arrow route, to which the user will be redirected (absolute url)
		loginRoute: "", // application login route (relative)
		authPaths: ["/auth/github/callback", "/api/github/users/"], // add an array of paths, for which the plugin will skip authentication
		mappedObject: {
			githubId : "id",
			displayName: "displayName",
			username: "username",
			profileUrl: "profileUrl",
			data : "_json"
		} // Object that maps user data persisted in re.user to response data from github
	},
```

`mappedObject` - is an Object mapping from github response object to the object that is going to be persisted in `req.user`.
Meaning that the keys of the object are going to be the keys of `req.user`
, while the values, are the github Object values .

#### How to obtain github API credentials:
* Visit https://github.com/settings/developers
* Register a new Application
* Copy the **credentials**


## 3.  Usage
 
 Once set, **appcgithubauth** checks if current user is authenticated, for all routes (except for the loginUrl). You can add exceptions ( routes / endpoints which unauthorized users can visit ). Just add paths to the `authPaths` Array. 

### 3.1.    Setting a login route
This route should be the same, as the one you set as loginRoute in the module's configuration.

```
var Arrow = require('arrow')
server = Arrow.getGlobal();
var auth = new (require('appcgithubauth'))(server);
var passport = auth.getPassport();

var LoginRoute = Arrow.Router.extend({
	name: 'login',
	path: '/auth/github/login',
	method: 'GET',
	description: 'this is an example web route',
	action: passport.authenticate('github')
});

module.exports = LoginRoute;
```
The `auth.passport.authenticate` method redirects the user to the login page of the identity provider ( **entryPoint** ).

### 3.2.    Setting a callback route
This route should match `callbackUrl` parameter from the config. This is where appcelerator-saml, grabs the response from the IDP and persists the data. You can later on access the data, trough the application's Request object.

```
var Arrow = require('arrow')
server = Arrow.getGlobal();
var auth = new (require('appcgithubauth'))(server);
var passport = auth.getPassport();

var CallbackRoute = Arrow.Router.extend({
	name: 'login',
	path: '/auth/github/callback',
	method: 'GET',
	description: 'this is an example web route',
	action: passport.authenticate('github',
		{
			successRedirect: "/api/github/success",
			failureRedirect: "/saml/login-error" // where the user gets redirected on errror
		})
});

module.exports = CallbackRoute;
```
The `successRedirect` property of auth.passport.authenticate, is the route where the user is going to be redirected on success.

### 3.4.    Using the information sent from the server
The authentication information is accessible through the Arrow's Request object

    request.isAuthenticated() // returns wether the user is authenticated
    request.user // returns user information object ( the one you set with resultObject )

Let's create a api endpoint that returns information on currently logged user.
```
    var Arrow = require('arrow');

var TestAPI = Arrow.API.extend({
	group: 'testapi',
	path: '/api/github/logged',
	method: 'GET',
	description: 'this is an api that shows how to implement an API',
	model: 'authUser',
	action: function (req, resp, next) {
		//marinvvasilev
		user_data = req.user;
		if (typeof user_data === "undefined") {
			// invoke the model find method passing the id parameter
			// stream the result back as response
			req.model.find({ username: "marinvvasilev" }, function (error, data) {
				user_data = data[0];
				resp.stream(getLoggedinData, next);
			})
		} else {
			resp.stream(getLoggedinData, next);
		}
	}
});

var user_data = {};

function getLoggedinData(callback) {
	callback(null, user_data);
}

module.exports = TestAPI;

```


    
### 3.4.    Setting up a logout route
```
var Arrow = require('arrow')
server = Arrow.getGlobal();
var auth = new (require('appcgithubauth'))(server);
var passport = auth.getPassport();

var LogoutRoute = Arrow.Router.extend({
	name: 'logout',
	path: '/auth/github/logout',
	method: 'GET',
	description: 'this is an example web route',
	action: function(req, resp){
		req.logout();
		resp.redirect('/');
	}
});

module.exports = LogoutRoute;
```



