/* StravaAPI
 *
 * By Ian Perrin http://github.com/ianperrin/MMM-Strava
 * MIT Licensed.
 */

/* jshint node: true, esversion: 6 */

var https = require('https');

var StravaAPI = (function() {

    var self = this;

    // Private Properties
    var HOST = 'www.strava.com';
    var API = '/api/v3/';
    var PORT = 443;

    /// Private Methods

    /**
     * makeRequest
     * Makes a https request to a  server.
     * @param  {Object} options request options.
     */
    function makeRequest(options) {

        console.log("MMM-Strava: Make request: " + options.path + " (" + options.method + ")");

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
                } else  {
                    console.log("MMM-Strava: Error performing request (" + response.statusCode + ")");
                    if (str) {
                        var error = JSON.parse(str);
                        if(error && error.message && error.errors[0]) {
                            console.log("MMM-Strava: " + error.message + ": " + error.errors[0].field + " " + error.errors[0].code + " for " + error.errors[0].resource  );
                        }
                    }
                    options.callback();
                }
            });

            response.on('error', function(e) {
                console.log("MMM-Strava: Unknown error performing request to endpoint: /" + options.path);
                options.callback();
            });
        });

        request.end();
    }

    /**
     * makeApiRequest
     * Perpare and makes the request to the Strava API server.
     * @param  {string}   accessToken   The access token for the API.
     * @param  {string}   endpoint      The endpoint of the API.
     * @param  {Function} callback      The callback after completion.
     */
    function makeApiRequest(accessToken, endpoint, callback) {
        // Validate arguments
        if (!accessToken) {
            console.log("MMM-Strava: No Access Token. Request one ...");
            return;
        }
        if (!endpoint) {
            console.log("MMM-Strava: No API endpoint. Supply one ...");
            return;
        }
        callback = callback || function() {};
        
        var options = {
                host: HOST,
                port: PORT,
                path: API + endpoint,
                method: 'GET', // GET | POST
                callback: callback,
                contentType: 'application/json',
                headers: {
                    'Authorization': 'Bearer ' + accessToken,
                    'Content-Type' : 'application/json'
                }
            };
        makeRequest(options);
    }

    /**
     * getAthleteStats
     * Request the recent (last 4 weeks), year to date and all time stats for a given athlete. 
     * @param  {string}   athleteId     The id for the currently authenticated athlete.
     * @param  {Function} callback         The callback after the data is received.
     * https://www.strava.com/api/v3/athletes/{athleteId}/stats
     */
    self.getAthleteStats = function(accessToken, athleteId, callback) {
        makeApiRequest(accessToken, 'athletes/' + athleteId + '/stats', function(data) {
            if (!data) {
                console.log("MMM-Strava: Error while fetching new athlete stats.");
                data = {};
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
        makeApiRequest(accessToken, 'athlete/activities?after=' + after, function(data) {
            if (!data) {
                console.log("MMM-Strava: Error while fetching athlete activities.");
                data = {};
            }
            callback(data);
        });
    };

    return self;
})();

module.exports = StravaAPI;
