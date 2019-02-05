/**
 * @file node_helper.js
 *
 * @author ianperrin
 * @license MIT
 *
 * @see  http://github.com/ianperrin/MMM-Strava
 */

/* jshint node: true, esversion: 6 */

/**
 * @external node_helper
 * @see https://github.com/MichMich/MagicMirror/blob/master/modules/node_modules/node_helper/index.js
 */
const NodeHelper = require('node_helper');
/**
 * @external request
 * @see https://www.npmjs.com/package/moment
 */
const moment = require('moment');
/**
 * @external request
 * @see https://www.npmjs.com/package/strava-v3
 */
const strava = require('strava-v3');

/**
 * @module node_helper
 * @description Backend for the module to query data from the API provider.
 *
 * @requires external:node_helper
 * @requires external:moment
 * @requires external:strava-v3
 */
 module.exports = NodeHelper.create({
    // Set the minimum MagicMirror module version for this module.
    requiresVersion: "2.2.0",
    /**
     * @function start
     * @description Logs a start message to the console.
     * @override
     */
    start: function() {
        console.log('Starting module helper: ' + this.name);
    },
    // Config store e.g. this.configs["identifier"])
    configs: Object.create(null),
    /**
     * @function socketNotificationReceived
     * @description Receives socket notifications from the module.
     * @override
     *
     * @param {string} notification - Notification name
     * @param {*} payload - Detailed payload of the notification.
     */
    socketNotificationReceived: function(notification, payload) {
        this.log('Received notification: ' + notification);
        if (notification === 'SET_CONFIG') {
            this.configs[payload.identifier] = payload.config;
        } else if (notification === 'GET_TABLE_DATA') {
            this.getAthleteStats(payload.identifier, payload.access_token, payload.athlete_id);
        } else if (notification === 'GET_CHART_DATA') {
            moment.locale(this.configs[payload.identifier].locale);
            var after = moment().startOf(this.configs[payload.identifier].period === 'ytd' ? 'year' : 'week').unix();
            this.getAthleteActivities(payload.identifier, payload.access_token, after);
        }
    },
    /**
     * @function getAthlete
     * @description get an athletes profile from the API
     */
//    getAthlete: function(identifier, access_token, athlete_id) {
//        this.log('Getting athlete for ' + identifier + ' using ' + athlete_id);
//        var self = this;
//        strava.athletes.get({'access_token': access_token, 'id': athlete_id}, function(err, payload, limits) {
//            self.handleApiResponse(identifier, err, payload, limits);
//        });
//    },
    /**
     * @function getAthleteStats
     * @description get stats for an athlete from the API
     */
    getAthleteStats: function(identifier, access_token, athlete_id) {
        this.log('Getting athlete stats for ' + identifier + ' using ' + athlete_id);
        var self = this;
        strava.athletes.stats({'access_token': access_token, 'id': athlete_id}, function(err, payload, limits) {
            var data = self.handleApiResponse(identifier, err, payload, limits);
            if (data) {
                self.sendSocketNotification('DATA', {'identifier': identifier, 'data': data});
            }
        });
    },
    /**
     * @function getAthleteActivities
     * @description get logged in athletes activities from the API
     */
    getAthleteActivities: function(identifier, access_token, after) {
        this.log('Getting athlete activities for ' + identifier + ' after ' + moment.unix(after).format("YYYY-MM-DD"));
        var self = this;
        strava.athlete.listActivities({'access_token': access_token, 'after': after}, function(err, payload, limits) {
            self.log(payload);
            var activityList = self.handleApiResponse(identifier, err, payload, limits);
            if (activityList) {
                var data = {
                    'identifier': identifier, 
                    'data': self.summariseActivities(identifier, activityList)
                };
                self.log(data);
                self.sendSocketNotification('DATA', data);
            }
        });
    },
    /**
     * @function handleApiResponse
     * @description handles the response from the API to catch errors and faults.
     */
    handleApiResponse: function(identifier, err, payload, limits) {
        this.log('Handling API response');
        // Strava-v3 package errors
        if(err) {
            this.log(err);
            this.sendSocketNotification('ERROR', {'identifier': identifier, 'data': {'message': err}});
            return false;
        }
        // Strava API 'fault'
        if(payload && payload.hasOwnProperty('message') && payload.hasOwnProperty('errors')) {
            this.log(payload.errors);
            this.sendSocketNotification('ERROR', {'identifier': identifier, 'data': payload});
            return false;
        }
        // Strava Data 
        if (payload) {
            return payload;
        }
        // Unknown response
        this.log('Could not handle API response');
        return false;
    },
    /**
     * @function summariseActivities
     * @description summarises a list of activities for display in the chart.
     */
    summariseActivities: function(identifier, activityList) {
        this.log('Summarising athlete activities for ' + identifier);
        var activitySummary = Object.create(null);
        var activityName;
        // Initialise activity summary
        var periodIntervals = this.configs[identifier].period === 'ytd' ? moment.monthsShort() : moment.weekdaysShort();
        for (var activity in this.configs[identifier].activities) {
            if (this.configs[identifier].activities.hasOwnProperty(activity)) {
                activityName = this.configs[identifier].activities[activity].toLowerCase();
                activitySummary[activityName] = {
                    total_distance: 0,
                    total_elevation_gain: 0,
                    total_moving_time: 0,
                    max_interval_distance: 0,
                    intervals: Array(periodIntervals.length).fill(0)
                };
            }
        }
        // Summarise activity totals and interval totals
        for (var i = 0; i < Object.keys(activityList).length; i++) {
            // Merge virtual activities
            activityName = activityList[i].type.toLowerCase().replace('virtual');
            var activityTypeSummary = activitySummary[activityName];
            // Update activity summaries
            if (activityTypeSummary) {
                var distance = activityList[i].distance;
                activityTypeSummary.total_distance += distance;
                activityTypeSummary.total_elevation_gain += activityList[i].total_elevation_gain;
                activityTypeSummary.total_moving_time += activityList[i].moving_time;
                const activityDate = moment(activityList[i].start_date_local);
                const intervalIndex = this.configs[identifier].period === 'ytd' ? activityDate.month() : activityDate.weekday();
                activityTypeSummary.intervals[intervalIndex] += distance;
                // Update max interval distance
                if (activityTypeSummary.intervals[intervalIndex] > activityTypeSummary.max_interval_distance) {
                    activityTypeSummary.max_interval_distance = activityTypeSummary.intervals[intervalIndex];
                }
            }
        }
        return activitySummary;
    },
    /**
     * @function log
     * @description logs the message, prefixed by the Module name, if debug is enabled.
     * @param  {string} msg            the message to be logged
     */
    log: function(msg) {
//        if (this.config && this.config.debug) {
            console.log(this.name + ': ', JSON.stringify(msg));
//        }
    } 
});
