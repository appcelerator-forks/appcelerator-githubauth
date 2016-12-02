var passport = require('passport');
var request = require('request');

/**
 * Plugin initialization logic
 * @param Object server
 * @param Object testConfig - optional - configuration settings for testing purposes
 */
function Plugin(server, testConfig) {
    this.server = server;
    this.config = server.config;
    if(testConfig){
        this.config = testConfig;
    }
    //Check if we have the right config
    this.checkConfiguration();
    this.settings = this.config.gihubAuth;
    //Init if not present
    if (typeof this.server.passport === "undefined")
        this.initGithubAuth();
    else
        this.passport = this.server.passport;
}
// Only validate requests to /api/foo
Plugin.prototype.matchURL = function (request) {
    return true;
};


Plugin.prototype.getPassport = function () {
    return this.passport;
}

//Checks if config parameters are supplied
Plugin.prototype.checkConfiguration = function () {
    if (typeof this.config.gihubAuth === "undefined") {
        throw new Error('Please check your configuration file. Property object "gihubAuth" is missing!');
    }
    return true;
}


// Check if the request has the X-Secret header and its value matches the config file
Plugin.prototype.validateRequest = function (request, response) {
    if ((typeof request.isAuthenticated !== 'function') || !request.isAuthenticated()) {
        if ((request.url).indexOf(this.config.gihubAuth.loginRoute) >= 0) {
            return true;
        }
        //Loop trough all authorized paths
        if (typeof this.settings.authPaths !== "undefined") {
            for (var i = 0; i < this.settings.authPaths.length; i++) {
                if ((request.url).indexOf(this.settings.authPaths[i]) >= 0) {
                    return true;
                }
            }
        }
        return false;
    } else {
        return true;
    }
};


Plugin.prototype.initGithubAuth = function () {
    if (this.server && this.server.app) {
        var GitHubStrategy = require('passport-github').Strategy;
        var userObject = new Object();

        passport.use(new GitHubStrategy({
            clientID: this.settings.clientID,
            clientSecret: this.settings.clientSecret,
            callbackURL: this.settings.callbackURL,
        }, function (accessToken, refreshToken, profile, cb) {
            userObject.githubId = profile.id;
            userObject.displayName = profile.displayName;
            userObject.username = profile.username;
            userObject.profileUrl = profile.profileUrl;
            userObject.data = profile._json;
            return cb(null, userObject);
        }
        ));

        passport.serializeUser(function (user, cb) {
            cb(null, user);
        });

        passport.deserializeUser(function (obj, cb) {
            cb(null, obj);
        });

        this.server.app.use(passport.initialize());
        this.server.app.use(passport.session());
        this.server.passport = passport;
        return passport;
    }
}

module.exports = Plugin;