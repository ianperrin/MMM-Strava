/* jshint node: true */
//var http = require('http');
var https = require('https');
//var querystring = require('querystring');
var extend = require('util')._extend;

const moment = require('moment');

var StravaAPI = (function() {

    var self = this;

    // Private Properties
    var HOST = 'www.strava.com';
    var API = '/api/v3/';
    var PORT = 443;

    /// Private Methods

    /**
     * makeRequest
     * Makes a request to the Strava API server. It can be used for both the API requests as well as the oAuth requests.
     * @param  {Object} options request options.
     */
    function makeRequest(accessToken, options) {

        var defaultOptions = {
            host: HOST,
            port: PORT,
            path: '/',
            method: 'GET', // GET | POST
            parameters: {},
            body: '',
            callback: function(){},
            contentType: 'application/json',
            authorization: 'bearer', // bearer | basic
            rejectUnauthorized: false,
            requestCert: true,
            agent: false,
            headers: {
                'Authorization': 'Bearer ' + accessToken
            }
        };

        options = extend(defaultOptions, options);

        console.log(moment().toISOString() + " Make request: " + options.path + " (" + options.method + ")" + " accessToken=" + accessToken);

        // Update Content-Type header
        options.headers  = extend(options.headers, {
            'Content-Type' : options.contentType
        });

        // Encode body if contentType is json.
        if (options.contentType === 'application/json') {
            options.body = JSON.stringify(options.body);
        }

        // Make changed to the request options headers if Authorization is basic.
        if (options.authorization === 'basic') {
            console.error('Basic authorization is not supported at this time.');
            process.exit(1);
            // options.headers  = extend(options.headers, {
            //     'Authorization' : 'Basic ' + new Buffer(APIKEY + ":" + APISECRET).toString('base64')
            // });
        }

        // Make changes to the request options headers if method is POST
        if (options.method === 'POST') {
            console.error('POST requests are not supported at this time.');
            process.exit(1);
            options.headers  = extend(options.headers, {
                'Content-Length': Buffer.byteLength(options.body),
            });
        }

        //console.log('options', options);

        var request = https.request(options, function(response) {
            response.setEncoding('utf8');

            var str = '';

            //another chunk of data has been recieved, so append it to `str`
            response.on('data', function (chunk) {
                str += chunk;
            });

            //the whole response has been recieved, so we just print it out here
            response.on('end', function () {
                if (response.statusCode === 200) {
                    if (str.length > 0) {
                        options.callback(JSON.parse(str));
                    } else {
                        options.callback({});
                    }
                } else if (response.statusCode === 401) {
                    // Unauthorized

                    console.log("Error performing request: Unauthorized. Access Token will be reset.");

                    // Lets cleanup the accessToken, since this might be the reason for the error.
                    // A new accessToken should be requested.

                    accessToken = false;

                    options.callback();

                } else if (response.statusCode === 500) {
                    // Interal server error. This might be caused because the agreement is not properly set.
                    // Let's reset it ...
                    console.log("Error performing request (500): " + str);

                    options.callback();

                } else if (response.statusCode === 503) {
                    // Probably a message throttle issue ... lets wait a while before we contine...
                    console.log("Exceeded quota. Waiting for 5 seconds.");
                    setTimeout(function() {
                        options.callback();
                    }, 5000);

                } else {
                    console.log("Error performing request: " + response.statusCode);
                    console.log(str);
                    options.callback();
                }
            });

            response.on('error', function(e) {
                console.log("Error performing request to endpoint: /" + options.path);
                options.callback();
            });
        });

        if (options.method === 'POST') {
            request.write(options.body);
        }

        request.end();
    }

    /**
     * makeApiRequest
     * Makes a request to the Strava JSON api.
     * @param  {options} options request options.
     */
    function makeApiRequest(accessToken, options) {
        if (!accessToken) {
            console.log("No Access Token. Request one ...");
            return;
        }

        //console.log("All good. Let's make a request ...");

        options = extend(options, {
                path: API + options.path
        });

        makeRequest(accessToken, options);
    }

    /**
     * makeSimpleApiRequest
     * @param  {string}   endpoint The endpoint of the API.
     * @param  {Function} callback The callback after completion.
     */
    function makeSimpleApiRequest(accessToken, endpoint, callback) {
        callback = callback || function() {};
        makeApiRequest(accessToken, {
            path: endpoint,
            callback: callback
        });
    }

    // Athletes

    /**
     * getAthleteStats
     * Request the recent (last 4 weeks), year to date and all time stats for a given athlete. 
     * @param  {string}   athleteId     The id for the currently authenticated athlete.
     * @param  {Function} callback         The callback after the data is received.
     * https://www.strava.com/api/v3/athletes/{athleteId}/stats
     */
    self.getAthleteStats = function(accessToken, athleteId, callback) {
        makeSimpleApiRequest(accessToken, 'athletes/' + athleteId + '/stats', function(data) {
            if (!data) {
                console.log("Error while fetching new athlete stats.");
                callback(data);
                return;
            }

            callback(data);
        });
    };

    /**
     * getActivityData
     * Request the activities for the current athlete week whose start date is after the specified time. 
     * @param  {int}   after    seconds since UNIX epoch, result will start with activities whose start_date is after this value, sorted oldest first.
     * @param  {Function} callback         The callback after the data is received.
     * https://www.strava.com/api/v3/athletes/activities?after={unixtimeinseconds}
     */
    self.getAthleteActivity = function(accessToken, after, callback) {
        makeSimpleApiRequest(accessToken, 'athlete/activities?after=' + after, function(data) {
            if (!data) {
                console.log("Error while fetching athlete activities.");
                callback(data);
                return;
            }

            callback(data);
        });
    };



    return self;
})();

module.exports = StravaAPI;
