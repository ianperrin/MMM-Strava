/* Magic Mirror
 * Module: MMM-Strava
 *
 * By Ian Perrin http://github.com/ianperrin/MMM-Strava
 * MIT Licensed.
 */

/* jshint node: true */
/* global Module, config, Log */

Module.register("MMM-Strava",{

    // Default module config.
    defaults: {
        strava_id: '',                        // Could get this from current athlete - https://strava.github.io/api/v3/athlete/#get-details
        access_token: '',                     // https://www.strava.com/settings/api
        activities: ["ride", "run", "swim"],  // Possible values "ride", "run", "swim"
        period: "recent",                     // Possible values "recent", "ytd", "all"
        auto_rotate: false,                   // Rotate stats through each period starting from specified period
        units: config.units,
        fade: false,
        fadePoint: 0.1,                       // Start on 1/4th of the list.
        reloadInterval: 5 * 60 * 1000,        // every 5 minutes
        updateInterval: 10 * 1000,            // 10 seconds
        animationSpeed: 2.5 * 1000,           // 2.5 seconds
    },

    // Store the strava data in an object.
    stravaData: {
        athleteStats: {
            ride_totals: null,
            run_totals: null,
            swim_totals: null
        }
    },

    // A loading boolean.
    loading: true,

    // Subclass getStyles method.
    getStyles: function() {
        return ['font-awesome.css','MMM-Strava.css'];
    },

    // Subclass getTranslations method.
    getTranslations: function() {
        return {
                en: "translations/en.json",
                nl: "translations/nl.json"
        };
    },

    // Subclass start method.
    start: function() {
        Log.info("Starting module: " + this.name);
        if (this.config.period != "recent" &&
            this.config.period != "ytd" &&
            this.config.period != "all")
        {
            this.config.period = "recent";
        }
        this.sendSocketNotification("CONFIG", this.config);
    },

    // Subclass socketNotificationReceived method.
    socketNotificationReceived: function(notification, payload) {
        Log.info("MMM-Strava received a notification:" + notification);
        if (notification === "ATHLETE_STATS") {
            var athleteStats = payload;

            for (var i = 0; i < this.config.activities.length; i++) {
                var currentActivity = this.config.activities[i].toLowerCase();

                var recentActivityStats = athleteStats["recent_" + currentActivity + "_totals"];
                if (recentActivityStats) {
                    this.stravaData.athleteStats["recent_" + currentActivity + "_totals"] = recentActivityStats;
                }
                var ytdActivityStats = athleteStats["ytd_" + currentActivity + "_totals"];
                if (ytdActivityStats) {
                    this.stravaData.athleteStats["ytd_" + currentActivity + "_totals"] = ytdActivityStats;
                }
                var allActivityStats = athleteStats["all_" + currentActivity + "_totals"];
                if (allActivityStats) {
                    this.stravaData.athleteStats["all_" + currentActivity + "_totals"] = allActivityStats;
                }
            }

            this.loading = false;

            this.scheduleUpdateInterval();


        }
    },

    // Override dom generator.
    getDom: function() {

        if (this.config.access_token.length <= 0 ||
            this.config.strava_id.length <= 0 ||
            this.config.activities.length <= 0) {
                var errorWrapper = document.createElement("div");
                errorWrapper.innerHTML = this.translate("CONFIG_MISSING");
                errorWrapper.className = "small dimmed light";
                return errorWrapper;
        }

        if (this.loading) {
            var loadingWrapper = document.createElement("div");
            loadingWrapper.innerHTML = this.translate("LOADING");
            loadingWrapper.className = "small dimmed light";
            return loadingWrapper;
        }

        if (this.config.activities.length > 0) {
            var tableWrapper = document.createElement("table");
            tableWrapper.className = "small";

            tableWrapper.appendChild(this.createHeaderRow());

            // Add row to table for each activity.
            for (var i = 0; i < this.config.activities.length; i++) {

                var activity = this.config.activities[i];
                Log.info("MMM-Strava creating table row for activity: " + activity + " in " + this.config.units);
                var activityTotals = this.stravaData.athleteStats[this.config.period + "_" + activity.toLowerCase() + "_totals"];
                var activityRow = this.createActivityRow(activity.toLowerCase(), 
                                                            this.translate(activity.toUpperCase()), 
                                                            activityTotals.count,
                                                            this.roundedToFixed(this.convertToUnits(activityTotals.distance), 1),
                                                            activityTotals.achievement_count);

                // Create fade effect.
                if (this.config.fade && this.config.fadePoint < 1) {
                    if (this.config.fadePoint < 0) {
                        this.config.fadePoint = 0;
                    }
                    var startingPoint = this.config.activities.length * this.config.fadePoint;
                    var steps = this.config.activities.length - startingPoint;
                    if (i >= startingPoint) {
                        var currentStep = i - startingPoint;
                        activityRow.style.opacity = 1 - (1 / steps * currentStep);
                    }
                }

                tableWrapper.appendChild(activityRow);

            }

            // Add period indicator if rotating
            if (this.config.auto_rotate) {
                var periodTr = document.createElement('tr');
                periodTr.className = "xsmall";

                var periodTd =  document.createElement("td");
                periodTd.innerHTML = "[" + this.translate( this.config.period.toUpperCase() ) + "]";
                periodTd.colSpan = tableWrapper.rows[0].cells.length; 
                periodTd.className = "align-right";
                periodTr.appendChild(periodTd);

                tableWrapper.appendChild(periodTr);                
            }

            return tableWrapper;

        }

    },


    /**
     * createHeaderRow
     * This method creates a table row for the stat headings.
     * @return {dom object}                    the table row (tr)
     */
    createHeaderRow: function() {
        var tr = document.createElement('tr');
        tr.className = "normal";

        var activityTypeTd =  document.createElement("td");
        tr.appendChild(activityTypeTd);

        var activitySymbolTd =  document.createElement("td");
        tr.appendChild(activitySymbolTd);

        tr.appendChild(this.createHeaderRowStatCell("hashtag"));        // Count
        tr.appendChild(this.createHeaderRowStatCell("arrows-h"));        // Distance

        if (this.config.period === "recent")
            tr.appendChild(this.createHeaderRowStatCell("trophy"));            // Achievement Count

        return tr;
    },

    /**
     * createHeaderRowStatCell
     * This method creates a table cell containing the supplied font awesome icon.
     * @param  {string} icon                the font awesome icon. (without 'fa-')
     * @return {dom object}                    the table cell (td)
     */
    createHeaderRowStatCell: function(icon) {

        var td =  document.createElement("td");
        td.className = "light symbol align-right stat";
        var tdIcon =  document.createElement("span");
        tdIcon.className = "fa fa-" + icon;
        td.appendChild(tdIcon);

        return td;
    },

    /**
     * createActivityRow
     * This method creates a table row with stats for an activity.
     * @param  {string} icon                the font awesome icon. (without 'fa-')
     * @param  {string} label                the label for the activity
     * @param  {number} count                the activity count
     * @param  {number} distance            the distance in metres
     * @param  {number} achievement_count     the number of achievements for the activity
     * @return {dom object}                    the table row (tr)
     */
    createActivityRow: function(icon, label, count, distance, achievement_count) {
        var tr = document.createElement("tr");
        tr.className = "normal";
        
        var activityTypeCell = document.createElement("td");
        activityTypeCell.className = "title light";
        activityTypeCell.innerHTML = label;
        tr.appendChild(activityTypeCell);

        var activityTypeIconCell = document.createElement("td");
        activityTypeIconCell.className = "bright symbol";
        var symbol =  document.createElement("span");
        symbol.className = "fa fa-" + icon;
        activityTypeIconCell.appendChild(symbol);
        tr.appendChild(activityTypeIconCell);

        tr.appendChild(this.createActivityRowStatCell(count));                // Count
        tr.appendChild(this.createActivityRowStatCell(distance));            // Distance

        if (this.config.period === "recent")
            tr.appendChild(this.createActivityRowStatCell(achievement_count));    // Achievement Count

        return tr;
    },

    /**
     * createActivityRowStatCell
     * This method creates a table cell containing the supplied HTML.
     * @param  {string} innerHTML            the contents of the cell
     * @return {dom object}                    the table cell (td)
     */
    createActivityRowStatCell: function(innerHTML) {

        var td =  document.createElement("td");
        td.className = "bright align-right stat";
        td.innerHTML = innerHTML;

        return td;
    },

    /* scheduleUpdateInterval()
     * Schedule visual update.
     */
    scheduleUpdateInterval: function() {
        var self = this;

        self.updateDom(self.config.animationSpeed);

        if (this.config.auto_rotate &&
            this.config.updateInterval) {
                setInterval(function() {
                    self.config.period = ((self.config.period == "recent") ? "ytd" : ((self.config.period == "ytd") ? "all" : "recent"));
                    self.updateDom(self.config.animationSpeed);
                }, this.config.updateInterval);
        }
    },

    /**
     * convertToUnits
     * This method converts the supplied value to either kilometres or miles depending on the value of config.units.
     * @param  {float} _float            the value (in metres) to be converted
     * @return {float}                    the converted value (in miles or kilometres)
     */
    convertToUnits: function (_float){
        var km = _float * 0.001;
        return (this.config.units.toLowerCase() === "imperial") ? km * 0.621 : km;
    },

    /**
     * roundedToFixed
     * This method rounds the supplied value to the specified number of decimal places.
     * @param  {float} _float            the value to be rounded
     * @param  {number} _digits            the number of decimal places
     * @return {float}                    the rounded value
     */
     roundedToFixed: function (_float, _digits){
        var rounder = Math.pow(10, _digits);
        return (Math.round(_float * rounder) / rounder).toFixed(_digits);
    },
});
