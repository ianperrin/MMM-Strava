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
        mode: 'table',                        // Possible values "table", "chart"
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

            if (this.config.mode === 'chart') {
                return this.createActivityChart();
            } else {
                return this.createStatsTable();
            }

        }

    },

    /**
     * createChart
     * This method creates a table to display the stats.
     * @return {dom object}                    a div element containing the activity chart
     */
    createActivityChart: function() {
        var chartWrapper = document.createElement("div");
        chartWrapper.className = "small";



        // Add div for each activity.
        for (var i = 0; i < this.config.activities.length; i++) {
            var activity = this.config.activities[i];

            var activityDiv = document.createElement("div");
            activityDiv.className = "week";
            activityDiv.id = activity.toLowerCase();

                var primaryStatsDiv = document.createElement("div");
                primaryStatsDiv.className = "primary-stats";

                    var actualDistanceSpan = document.createElement("span");
                    actualDistanceSpan.innerHTML = "38.1 mi";
                    actualDistanceSpan.className = "actual small bright";
                    primaryStatsDiv.appendChild(actualDistanceSpan);

                    var inlineStatsList = document.createElement("ul");
                    inlineStatsList.className = "inline-stats";

                        var durationListItem = document.createElement("li");
                        durationListItem.innerHTML = "2h 39m";
                        durationListItem.className = "xsmall light";
                        inlineStatsList.appendChild(durationListItem);

                        var elevationListItem = document.createElement("li");
                        elevationListItem.innerHTML = "1,604 ft";
                        elevationListItem.className = "xsmall light";
                        inlineStatsList.appendChild(elevationListItem);

                    primaryStatsDiv.appendChild(inlineStatsList);

                activityDiv.appendChild(primaryStatsDiv);




activityDiv.innerHTML += `
<svg version="1.1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" class="chart" width="115" height="68" role="img">
<g class="activity-chart" transform="translate(25, 5)">
    <g transform="translate(0,0)" class="volume-bar-container">
        <rect class="volume-bar past" y="15.770875162395178" height="32.22912483760482" width="6.571428571428571"></rect>
    </g>
    <g transform="translate(12.571428571428571,0)" class="volume-bar-container">
        <rect class="volume-bar past" y="15.658438644147871" height="32.34156135585213" width="6.571428571428571"></rect>
    </g>
    <g transform="translate(25.142857142857142,0)" class="volume-bar-container">
        <rect class="volume-bar past" y="15.548836659974015" height="32.451163340025985" width="6.571428571428571"></rect>
    </g>
    <g transform="translate(37.714285714285715,0)" class="volume-bar-container">
        <rect class="volume-bar past" y="46" height="2" width="6.571428571428571"></rect>
    </g>
    <g transform="translate(50.285714285714285,0)" class="volume-bar-container">
        <rect class="volume-bar past" y="46" height="2" width="6.571428571428571"></rect>
    </g>
    <g transform="translate(62.857142857142854,0)" class="volume-bar-container">
        <rect class="volume-bar highlighted" y="0" height="48" width="6.571428571428571"></rect>
    </g>
    <g transform="translate(75.42857142857143,0)" class="volume-bar-container">
        <rect class="volume-bar future" y="46" height="2" width="6.571428571428571"></rect>
    </g>
    <g transform="translate(0,63)" class="day-label-container">
        <text class="day-label past" x="0" y="0">M</text>
    </g>
    <g transform="translate(12.571428571428571,63)" class="day-label-container">
        <text class="day-label past" x="0" y="0">T</text>
    </g>
    <g transform="translate(25.142857142857142,63)" class="day-label-container">
        <text class="day-label past" x="0" y="0">W</text>
    </g>
    <g transform="translate(37.714285714285715,63)" class="day-label-container">
        <text class="day-label past" x="0" y="0">T</text>
    </g>
    <g transform="translate(50.285714285714285,63)" class="day-label-container">
        <text class="day-label past" x="0" y="0">F</text>
    </g>
    <g transform="translate(62.857142857142854,63)" class="day-label-container">
        <text class="day-label highlighted" x="0" y="0">S</text>
    </g>
    <g transform="translate(75.42857142857143,63)" class="day-label-container">
        <text class="day-label future" x="0" y="0">S</text>
    </g>
</g>
</svg>

`;

            chartWrapper.appendChild(activityDiv);

        }

        return chartWrapper;
    },

    /**
     * createStatsTable
     * This method creates a table to display the stats.
     * @return {dom object}                    the table containing the stats
     */
    createStatsTable: function() {
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
