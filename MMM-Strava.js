



/**
 * @file MMM-Strava.js
 *
 * @author ianperrin
 * @license MIT
 *
 * @see  https://github.com/ianperrin/MMM-Strava
 */

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
Module.register("MMM-Strava", {
    // Set the minimum MagicMirror module version for this module.
    requiresVersion: "2.2.0",
    // Default module config.
    defaults: {
        client_id: "",
        client_secret: "",
        mode: "chart",                                  // Possible values "table", "chart", "progressbar"
        activities: ["ride", "run", "swim"],            // Possible values "ride", "run", "swim"
        period: "recent",                               // Possible values "recent", "ytd", "all"
        stats: ["count", "distance", "pace", "achievements"],   // Possible values "count", "distance", "pace", "elevation", "moving_time", "elapsed_time", "achievements"
        auto_rotate: false,                             // Rotate stats through each period starting from specified period
        locale: config.language,
        units: config.units,
        reloadInterval: 5 * 60 * 1000,                  // every 5 minutes
        updateInterval: 20 * 1000,                      // 10 seconds
        animationSpeed: 0 * 1000,                     // 2.5 seconds
        showProgressBar: true,
        shownPB: "ride",                                //will revolve between all progressbars with a goal
        goals: {
          "ride": 1000,
          "run": 750,
          "swim": 0,
        },
        debug: true,                                    // Set to true to enable extending logging
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
        return ["font-awesome.css", "MMM-Strava.css"];
    },
    /**
     * @function getScripts
     * @description Script dependencies for this module.
     * @override
     *
     * @returns {string[]} List of the script dependency filepaths.
     */
    getScripts: function() {
        return ["moment.js"];
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
        Log.info("Starting module: " + this.name);
        // Validate config
        this.config.mode = this.config.mode.toLowerCase();
        this.config.period = this.config.period.toLowerCase();
        // Add custom filters
        this.addFilters();
        // Initialise helper and schedule api calls
        this.log("Sending socket notification GET_DATA");
        if (this.loading) {this.sendSocketNotification("GET_STRAVA_DATA", {"identifier": this.identifier, "config": this.config});}
        this.scheduleUpdates();
    },


    socketNotificationReceived: function(notification, payload) {
        this.log(`Receiving notification: ${notification} for ${payload.identifier}`);
        if (payload.identifier === this.identifier) {
            if (notification === "STATS") {
                this.stats = payload.stats;
                this.log("Athlete stats: "+JSON.stringify(this.stats));
                //this.loading = false;
                //this.updateDom(this.config.animationSpeed);
            } else if (notification === "ACTIVITIES") {
                this.activities = payload.data;
                this.log("Athlete activities: "+JSON.stringify(this.activities));
                this.loading = false;
                this.updateDom(this.config.animationSpeed);
            } else if (notification === "ERROR") {
                this.loading = false;
                this.error = payload.data.message;
                this.updateDom(this.config.animationSpeed);
            } else if (notification === "WARNING") {
                this.loading = false;
                this.sendNotification("SHOW_ALERT", {type: "notification", title: payload.data.message});
            }
        }
    },


    getTemplate: function() {
        return "templates\\MMM-Strava." + this.config.mode + ".njk";
    },


    getTemplateData: function() {
        moment.locale(this.config.locale);
        this.log("Updating template data");
        return {
            config: this.config,
            loading: this.loading,
            error: this.error || null,
            stats: this.stats || {},
            activities: this.activities || {},
            chart: {bars: this.config.period === "ytd" ? moment.monthsShort() : moment.weekdaysShort() },
            progressBar: {
              "run": this.addMeasure(this.stats.ytd_run_totals.distance, "run"),
              "ride": this.addMeasure(this.stats.ytd_ride_totals.distance, "ride"),
              "swim": this.addMeasure(this.stats.ytd_swim_totals.distance, "swim")
            }
        };
    },


    scheduleUpdates: function() {
        var self = this;
        // Schedule table rotation
        if (!this.rotating && this.config.mode === "table") {
            this.rotating = true;
            if (this.config.auto_rotate && this.config.updateInterval) {
                setInterval(function() {
                    // Get next period
                    self.config.period = ((self.config.period === "recent") ? "ytd" : ((self.config.period === "ytd") ? "all" : "recent"));
                    self.config.shownPB = ((self.config.shownPB === "ride" && self.config.goals.run) ? "run" : ((self.config.shownPB === "run" && self.config.goals.swim) ? "swim" : "ride"));
                    self.updateDom(self.config.animationSpeed);
                }, this.config.updateInterval);
            }
        }
    },


    log: function(msg) {
        if (this.config && this.config.debug) {
            Log.info(`${this.name}: ` + JSON.stringify(msg));
        }
    },


    addFilters() {
        var env = this.nunjucksEnvironment();
        env.addFilter("getIntervalClass", this.getIntervalClass.bind(this));
        env.addFilter("getLabel", this.getLabel.bind(this));
        env.addFilter("formatTime", this.formatTime.bind(this));
        env.addFilter("formatDistance", this.formatDistance.bind(this));
        env.addFilter("formatElevation", this.formatElevation.bind(this));
        env.addFilter("roundValue", this.roundValue.bind(this));
        env.addFilter("getPace", this.getPace.bind(this));
    },


    getIntervalClass: function(interval)
    {
        moment.locale(this.config.locale);
        var currentInterval = this.config.period === "ytd" ? moment().month() : moment().weekday();
        var className = "future";
        if (currentInterval === interval) {
            className = "current";
        } else if (currentInterval > interval) {
            className = "past";
        }
        return className;
    },


    getLabel: function(interval) {
        moment.locale(this.config.locale);
        const startUnit = this.config.period === "ytd" ? "year" : "week";
        const intervalUnit = this.config.period === "ytd" ? "months" : "days";
        const labelUnit = this.config.period === "ytd" ? "MMM" : "dd";
        var intervalDate = moment().startOf(startUnit).add(interval, intervalUnit);
        return intervalDate.format(labelUnit).slice(0,1).toUpperCase();
    },

    /**
     * @function getPace
     * @description calculates and returns pace for display in nunjuck template.
     * @param  {string} acivity            the activity (period is not important here)
     * @param  {string} distance           the distance for the activity and period
     * @param  {string} moving_time        the moving time for the activity and period

     * @returns {string} pace
     */
    getPace: function(activity, distance, moving_time) {
        moment.locale(this.config.locale);
        var pace = 0;
        if (distance > 0)
        {
          switch (activity) {
            case "run":
              distance = (this.config.units == "metric") ? (distance / 1000) : (distance / 1609.34);
              //moment.js "hack" to convert pace into m:ss. The number of seconds is added to start of the day (0:00) and the new "time" is converted to m:ss
              pace = moment().startOf("day").seconds(Math.round(moving_time / distance)).format("m:ss");
              break;
            case "swim":
              distance = (this.config.units == "metric") ? (distance) : (distance / 1.60934);
              pace = (distance / moving_time * 3.6).toFixed(2);
              break;
            case "ride":
              distance = (this.config.units == "metric") ? (distance / 100) : (distance / 100 * 0.9144);
              pace = moment().startOf("day").seconds(Math.round(moving_time / distance)).format("m:ss");
              break;
            default:
              pace = 0;
          }
        } else {
          pace = 0;
        }
        return pace;
    },


    formatTime: function(timeInSeconds) {
        var duration = moment.duration(timeInSeconds, "seconds");
        return Math.floor(duration.asHours()) + "h " + duration.minutes() + "m";
    },


    formatDistance: function(value, digits, showUnits) {
        const distanceMultiplier = this.config.units === "imperial" ? 0.0006213712 : 0.001;
        const distanceUnits = this.config.units === "imperial" ? " mi" : " km";
        return this.formatNumber(value, distanceMultiplier, digits, (showUnits ? distanceUnits : null));
    },


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


    roundValue: function(value, digits) {
      var rounder = Math.pow(10, digits);
      return (Math.round(value * rounder) / rounder).toFixed(digits);
    },


    /**
     * @function addMeasure
     * @description adds measure offset to progress bar to show comparative progress.
     *
     */
    addMeasure: function(distance, sport) {
      var partOfYear = (moment().dayOfYear() / moment().endOf("year").dayOfYear());
      var toMeasure = Math.round( 510 * (1 - partOfYear));

      var reached = (distance / (this.config.goals[sport] * 1000));
      // Calculate the percentage of the total length
      var toRes = Math.round( 510 * (1 - reached));
      //this.log("New offset: "+to);

      var distToMeasure = Math.round(partOfYear * this.config.goals[sport] * 1000);
      var deviation = distance - distToMeasure;
      //return progress bar parameters
      return({
        "toMeasure": Math.max(0, toMeasure),
        "offset": Math.max(0, toRes),
        "deviation": deviation,
        "threshold": Math.round(-510 * partOfYear),
        "distance": distance,
      });
    }
});
