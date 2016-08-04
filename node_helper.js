
/* MMM-Strava
 * Node Helper
 *
 * By Ian Perrin http://github.com/ianperrin/MMM-Strava
 * MIT Licensed.
 */

var StravaAPI = require("./StravaAPI.js");

module.exports = NodeHelper.create({
    // Subclass start method.
    start: function() {
        console.log("Starting module: " + this.name);
        this.config = {};
        this.fetcherRunning = false;
        this.athleteStats = false;
    },

    // Subclass socketNotificationReceived received.
    socketNotificationReceived: function(notification, payload) {
        console.log("MMM-Strava received a notification: " + notification);
        if (notification === "CONFIG") {
            
            this.config = payload;
            if (this.config.access_token && this.config.strava_id) {
                if (!this.fetcherRunning) {
                    StravaAPI.setAccessToken(this.config.access_token);
                    this.fetchAthleteStats(this.config.strava_id);
                }
            }

            if (this.athleteStats) {
                this.sendSocketNotification('ATHLETE_STATS', this.athleteStats);
            }
        }
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
