/**
 * @file strava_api.js
 *
 * @description Extends strava-v3 package to add support for OAuth2 flow.
 * @author ianperrin
 * @license MIT
 *
 * @see http://github.com/ianperrin/MMM-Strava
 * @see https://developers.strava.com/docs/authentication/
 * @see https://github.com/UnbounDev/node-strava-v3/tree/v1.14.0
 * @see https://github.com/UnbounDev/node-strava-v3/issues/73
 */

var strava = require("strava-v3"),
    path = require("path");

let packagePath = path.dirname(require.resolve("strava-v3/package.json"));

var authenticator = require(path.join(packagePath, "lib", "authenticator")),
    request = require("request"),
    querystring = require("querystring");

/**
 * Base url for OAuth endpoints
 */
strava.oauth.endpointBase = "https://www.strava.com/oauth/";

/**
 * Allow client_id and client_secret to be optionally set via args
 * @override strava-v3.oauth.getRequestAccessURL()
 */
delete strava.oauth.getRequestAccessURL;
strava.oauth.getRequestAccessURL = function(args){

    var endpoint = "authorize?";
    var url = this.endpointBase + endpoint,
        oauthArgs = {
            client_id: args.client_id || authenticator.getClientId(),
            redirect_uri: args.redirect_uri || authenticator.getRedirectUri(),
            response_type: "code"
        };

    if (args.scope) {
        oauthArgs.scope = args.scope;
    }
    if (args.state) {
        oauthArgs.state = args.state;
    }
    if (args.approval_prompt) {
        oauthArgs.approval_prompt = args.approval_prompt;
    }

    var qs = querystring.stringify(oauthArgs);

    url += qs;
    return url;
};

/**
 * @function exchangeToken
 * @description Exchange the authorization code for a refresh token and short-lived access token.
 *
 * @param {object} args - optional arguments to override client_secret and client_id
 * @param {string} code - The `code` parameter obtained in the redirect.
 * @param {function} done - optional callback function
 */
strava.oauth.exchangeToken = function(args, code, done) {
    var endpoint = "token";
    var tokenArgs = {
        code: code,
        client_secret: args.client_secret || authenticator.getClientSecret(),
        client_id: args.client_id || authenticator.getClientId(),
        grant_type: "authorization_code"
    };
    var options = {
        url: this.endpointBase + endpoint,
        method: "POST",
        json: true,
        body: tokenArgs
    };
    _requestHelper(options, done);
};

/**
 * @function refreshTokens
 * @description Refreshes expired tokens
 *
 * @param {object} args - optional arguments to override client_secret and client_id
 * @param {string} refreshToken - The refresh token obtained for this user, to be used to get the next access token for this user.
 * @param {function} done - optional callback function
 */
strava.oauth.refreshTokens = function(args, refreshToken, done){
    var endpoint = "token";
    var tokenArgs = {
        refresh_token: refreshToken,
        client_secret: args.client_secret || authenticator.getClientSecret(),
        client_id: args.client_id || authenticator.getClientId(),
        grant_type: "refresh_token"
    };
    var options = {
        url: this.endpointBase + endpoint,
        method: "POST",
        json: true,
        body: tokenArgs
    };
    _requestHelper(options, done);
};

//===== helpers =====
var _requestHelper = function(options, done) {
    request(options, function (err, response, payload) {
        if (err) {
            console.log("api call error");
            console.log(err);
        }
        done(err, payload);
    });
};
//===== helpers =====

// re-export the module with changes
module.exports = strava;
