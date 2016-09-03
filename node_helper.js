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
        this.fetcherRunning = false;
        this.athleteActivity = false;
    },

    // Subclass socketNotificationReceived received.
    socketNotificationReceived: function(notification, payload) {
        console.log("MMM-Strava received a notification: " + notification);
        if (notification === "CONFIG") {
            
            this.config = payload;
            if (this.config.access_token && this.config.strava_id) {
                if (!this.fetcherRunning) {
                    StravaAPI.setAccessToken(this.config.access_token);

                    if (this.config.mode === 'chart') {
                        this.fetchAthleteActivity(moment().startOf('week').unix());
                    } else {
                        this.fetchAthleteStats(this.config.strava_id);
                    }

                }
            }

            if (this.config.mode === 'chart' && this.athleteActivity) {
                this.sendSocketNotification('ATHLETE_ACTIVITY', this.athleteActivity);
            } else if (this.athleteStats) {
                this.sendSocketNotification('ATHLETE_STATS', this.athleteStats);
            }
        }
    },

    /**
     * fetchAthleteActivity
     * Request athlete activity since a specified point from the Strava API and broadcast it to the MagicMirror module if it's received.
     * @param  {int}   after    seconds since UNIX epoch, result will start with activities whose start_date is after this value, sorted oldest first.
     */
    fetchAthleteActivity: function(after) {
        console.log("MMM-Strava is fetching athlete activity");
        var self = this;
        this.fetcherRunning = true;
        StravaAPI.getAthleteActivity(after, function(athleteActivity) {
            if (athleteActivity && athleteActivity.updated) {
                self.athleteActivity = athleteActivity;
                self.sendSocketNotification('ATHLETE_ACTIVITY', athleteActivity);
            }

            setTimeout(function() {
                self.fetchAthleteActivity(moment().startOf('week').unix());
            }, self.config.reloadInterval);
        });
    },

    /**
     * fetchAthleteStats
     * Request new athelete stats from the Strava API and broadcast it to the MagicMirror module if it's received.
     * @param  {string}   athleteId The id of the current athlete.
     */
    fetchAthleteStats: function(athleteId) {
        console.log("MMM-Strava is fetching athlete stats");
        var self = this;
        this.fetcherRunning = true;
        StravaAPI.getAthleteStats(athleteId, function(athleteStats) {
            if (athleteStats && athleteStats.updated) {
                self.athleteStats = athleteStats;
                self.sendSocketNotification('ATHLETE_STATS', athleteStats);
            }

            setTimeout(function() {
                self.fetchAthleteStats(athleteId);
            }, self.config.reloadInterval);
        });
    }
});
