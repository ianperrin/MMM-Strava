/**
 * @file MMM-Strava.js
 *
 * @author ianperrin
 * @license MIT
 *
 * @see  https://github.com/ianperrin/MMM-Strava
 */

/* jshint node: true, esversion: 6 */
/* global Module, config, Log, moment */

/**
 * @external Module
 * @see https://github.com/MichMich/MagicMirror/blob/master/js/module.js
 */

/**
 * @external config
 * @see https://github.com/MichMich/MagicMirror/blob/master/config/config.js.sample
 */

/**
 * @external Log
 * @see https://github.com/MichMich/MagicMirror/blob/master/js/logger.js
 */

/**
 * @external moment
 * @see https://www.npmjs.com/package/moment
 */

/**
 * @module MMM-Strava
 * @description Frontend of the MagicMirror² module.
 *
 * @requires external:Module
 * @requires external:config
 * @requires external:Log
 * @requires external:moment
 */
Module.register('MMM-Strava',{
    // Set the minimum MagicMirror module version for this module.
    requiresVersion: "2.2.0",
    // Default module config.
    defaults: {
        strava_id: '',                        // List of strava_id's, could get this from current athlete - https://strava.github.io/api/v3/athlete/#get-details
        access_token: '',                     // List of acces_token's (corresponding to the strava_id's), see https://www.strava.com/settings/api
        mode: 'table',                        // Possible values "table", "chart"
        activities: ["ride", "run", "swim"],  // Possible values "ride", "run", "swim"
        period: "recent",                     // Possible values "recent", "ytd", "all"
        elevation: false,                     // Shows elevation in "table" mode
        auto_rotate: false,                   // Rotate stats through each period starting from specified period
        locale: config.language,
        units: config.units,
        fade: false,
        fadePoint: 0.1,                       // Start on 1/4th of the list.
        reloadInterval: 5 * 60 * 1000,        // every 5 minutes
        updateInterval: 10 * 1000,            // 10 seconds
        animationSpeed: 2.5 * 1000,           // 2.5 seconds
        debug: false,                         // Set to true to enable extending logging
    },
    /**
     * @member {boolean} loading - Flag to indicate the loading state of the module.
     */
    loading: true,
    /**
     * @member {boolean} rotating - Flag to indicate the rotating state of the module.
     */
    rotating: false,
    /**
     * @function getStyles
     * @description Style dependencies for this module.
     * @override
     *
     * @returns {string[]} List of the style dependency filepaths.
     */
    getStyles: function() {
        return ['font-awesome.css', 'MMM-Strava.css'];
    },
    /**
     * @function getScripts
     * @description Script dependencies for this module.
     * @override
     *
     * @returns {string[]} List of the script dependency filepaths.
     */
    getScripts: function() {
        return ['moment.js'];
    },
    /**
     * @function getTranslations
     * @description Translations for this module.
     * @override
     *
     * @returns {Object.<string, string>} Available translations for this module (key: language code, value: filepath).
     */
    getTranslations: function() {
        return {
                en: "translations/en.json",
                nl: "translations/nl.json",
                de: "translations/de.json",
                id: "translations/id.json",
                hu: "translations/hu.json"
        };
    },
    /**
     * @function start
     * @description Validates config values, adds nunjuck filters and initialises requests for data.
     * @override
     */
    start: function() {
        Log.info('Starting module: ' + this.name);
        // Validate config
        this.config.mode = this.config.mode.toLowerCase();
        this.config.period = this.config.period.toLowerCase();
        // Add custom filters
        this.addFilters();
        // Initialise helper and schedule api calls
        this.sendSocketNotification('SET_CONFIG', {'identifier': this.identifier, 'config': this.config});
        this.scheduleUpdates();
    },
    /**
     * @function socketNotificationReceived
     * @description Handles incoming messages from node_helper.
     * @override
     *
     * @param {string} notification - Notification name
     * @param {*} payload - Detailed payload of the notification.
     */
    socketNotificationReceived: function(notification, payload) {
        this.log(`Receiving notification: ${notification} for ${payload.identifier}`);
        if (payload.identifier === this.identifier) {
            if (notification === 'DATA') {
                this.api_data = payload.data;
                this.loading = false;
                this.updateDom(this.config.animationSpeed);
            } else if (notification === 'ERROR') {
                this.log(payload);
                this.loading = false;
                this.api_error = payload.data;
                this.updateDom(this.config.animationSpeed);
            }
        }
    },
    /**
     * @function getTemplate
     * @description Nunjuck template.
     * @override
     *
     * @returns {string} Path to nunjuck template.
     */
    getTemplate: function() {
        return 'MMM-Strava.html.' + this.config.mode + '.njk';
    },
    /**
     * @function getTemplateData
     * @description Data that gets rendered in the nunjuck template.
     * @override
     *
     * @returns {string} Data for the nunjuck template.
     */
    getTemplateData: function() {
        moment.locale('en-gb');
        return {
            config: this.config,
            loading: this.loading,
            error: this.api_error || {},
            data: this.api_data || {},
            chart: {bars: this.config.period === 'ytd' ? moment.monthsShort() : moment.weekdaysShort() }, 
        };
    },
    /**
     * @function scheduleUpdates
     * @description Schedules retrieval of API data and table rotation
     */
    scheduleUpdates: function() {
        var self = this;
        // Schedule API calls
        this.getData();
        setInterval(function() {
            self.getData();
        }, this.config.reloadInterval);
        // Schedule table rotation
        if (!this.rotating) {
            this.rotating = true;
            if (this.config.auto_rotate && this.config.updateInterval) {
                setInterval(function() {
                    // Get next period
                    self.config.period = ((self.config.period === 'recent') ? 'ytd' : ((self.config.period === 'ytd') ? 'all' : 'recent'));
                    self.updateDom(self.config.animationSpeed);
                }, this.config.updateInterval);
            }
        }
    },
    /**
     * @function getData
     * @description Sends request to the node_helper to fetch data from the API.
     */
    getData: function() {
        Log.info('Sending GET_DATA notification for', this.identifier);
        var payload = { 
            'identifier': this.identifier, 
            access_token: this.config.access_token, 
            athlete_id: this.config.strava_id
        };
        this.sendSocketNotification(`GET_${this.config.mode.toUpperCase()}_DATA`, payload);
    },
    /**
     * @function log
     * @description logs the message, prefixed by the Module name, if debug is enabled.
     * @param  {string} msg            the message to be logged
     */
    log: function(msg) {
        if (this.config && this.config.debug) {
            Log.info(`${this.name}: ` + JSON.stringify(msg));
        }
    },
    /**
     * @function addFilters
     * @description adds filters to the Nunjucks environment.
     */
    addFilters() {
        var env = this.nunjucksEnvironment();
        env.addFilter("getPeriodClass", this.getPeriodClass.bind(this));
        env.addFilter("getLabel", this.getLabel.bind(this));
        env.addFilter("formatTime", this.formatTime.bind(this));
        env.addFilter("formatDistance", this.formatDistance.bind(this));
        env.addFilter("formatElevation", this.formatElevation.bind(this));
        env.addFilter("roundValue", this.roundValue.bind(this));
    },
    getPeriodClass: function(interval)
    {
        moment.locale(this.config.locale);
        const currentInterval = this.config.period === 'ytd' ? moment().month() : moment().weekday();
        var period = 'future';
        if (currentInterval === interval) {
            period = 'current';
        } else if (currentInterval > interval) {
            period = 'past';
        }
        return period;
    },
    getLabel: function(interval) {
        moment.locale(this.config.locale);
        const startUnit = this.config.period === 'ytd' ? 'year' : 'week';
        const intervalUnit = this.config.period === 'ytd' ? 'months' : 'days';
        const labelUnit = this.config.period === 'ytd' ? 'MMM' : 'dd';
        var intervalDate = moment().startOf(startUnit).add(interval, intervalUnit);
        return intervalDate.format(labelUnit).slice(0,1).toUpperCase();
    },
    formatTime: function(timeInSeconds) {
        var duration = moment.duration(timeInSeconds, "seconds");
        return Math.floor(duration.asHours()) + "h " + duration.minutes() + "m";
    },
    // formatDistance
    formatDistance: function(value, digits, showUnits) {
        const distanceMultiplier = this.config.units === "imperial" ? 0.0006213712 : 0.001;
        const distanceUnits = this.config.units === "imperial" ? " mi" : " km";
        return this.formatNumber(value, distanceMultiplier, digits, (showUnits ? distanceUnits : null));
    },
    // formatElevation
    formatElevation: function(value, digits, showUnits) {
        const elevationMultiplier = this.config.units === "imperial" ? 3.28084 : 1;
        const elevationUnits = this.config.units === "imperial" ? " ft" : " m";
        return this.formatNumber(value, elevationMultiplier, digits, (showUnits ? elevationUnits : null));
    },
    // formatNumber
    formatNumber: function(value, multipler, digits, units) {
        // Convert value
        value = value * multipler;
        // Round value
        value = this.roundValue(value, digits);
        // Append units
        if (units) {
            value += units;
        }
        return value;
    },
    /**
     * @function roundValue
     * @description rounds the value to number of digits.
     * @param  {decimal} value            the value to be rounded 
     * @param  {integer} digits           the number of digits to round the value to
     */
    roundValue: function(value, digits) {
        var rounder = Math.pow(10, digits);
        return (Math.round(value * rounder) / rounder).toFixed(digits);
    }
});
