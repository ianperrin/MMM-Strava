/* MMM-Strava
 * Node Helper
 *
 * By Ian Perrin http://github.com/ianperrin/MMM-Strava
 * MIT Licensed.
 */

/* jshint node: true, esversion: 6 */

const NodeHelper = require("node_helper");
const moment = require('moment');
const StravaAPI = require("./StravaAPI.js");

module.exports = NodeHelper.create({
    // Subclass start method.
    start: function() {
        console.log("Starting module: " + this.name);
        this.config = {};	
    },

    // Subclass socketNotificationReceived received.
    socketNotificationReceived: function(notification, payload) {
        this.log("Received notification: " + notification);
        if (notification === "CONFIG") {
            
            this.config = payload;
            moment.locale(this.config.locale);

            for (i = 0; i < this.config.access_token.length; i++) {
				
				if (this.config.mode === 'chart') {
					this.fetchAthleteActivity(this.config.access_token[i], moment().startOf('week').unix());
				} else {
					this.fetchAthleteStats(this.config.access_token[i], this.config.strava_id[i]);
				}
			}

        }
    },

    /**
     * fetchAthleteActivity
     * Request athlete activity since a specified point from the Strava API and broadcast it to the MagicMirror module if it's received.
     * @param  {int}   after    seconds since UNIX epoch, result will start with activities whose start_date is after this value, sorted oldest first.
     */
    fetchAthleteActivity: function(access_token, after) {
        this.log("Fetching athlete activity after " + after);
        var self = this;
        StravaAPI.getAthleteActivity(access_token, after, function(athleteActivity) {
            if (athleteActivity) {
                self.log(athleteActivity);
                self.sendSocketNotification('ATHLETE_ACTIVITY' + access_token, athleteActivity);
            }

            setTimeout(function() {
                self.fetchAthleteActivity(access_token, moment().startOf('week').unix());
            }, self.config.reloadInterval);
        });
    },

    /**
     * fetchAthleteStats
     * Request new athelete stats from the Strava API and broadcast it to the MagicMirror module if it's received.
     * @param  {string}   athleteId The id of the current athlete.
     */
    fetchAthleteStats: function(access_token, athleteId) {
        this.log("Fetching athlete stats");
        var self = this;	
        StravaAPI.getAthleteStats(access_token, athleteId, function(athleteStats) {
            if (athleteStats) {
                self.log(athleteStats);
                self.sendSocketNotification('ATHLETE_STATS' + access_token, athleteStats);
            }

            setTimeout(function() {
                self.fetchAthleteStats(access_token, athleteId);
            }, self.config.reloadInterval);
        });
    },
    
    /**
     * log
     * This method logs the message, prefixed by the Module name, if debug is enabled.
     * @param  {string} msg            the message to be logged
     */
    log: function(msg) {
        if (this.config && this.config.debug) {
            console.log(this.name + ': ' + JSON.stringify(msg));
        }
    }    
});
