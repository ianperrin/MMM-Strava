/* Magic Mirror
 * Module: MMM-Strava
 *
 * By Ian Perrin http://github.com/ianperrin/MMM-Strava
 * MIT Licensed.
 */

/* jshint node: true */
/* global Module, config, Log, moment */

Module.register("MMM-Strava",{

    // Default module config.
    defaults: {
        strava_id: '',                        // Could get this from current athlete - https://strava.github.io/api/v3/athlete/#get-details
        access_token: '',                     // https://www.strava.com/settings/api
        mode: 'table',                        // Possible values "table", "chart"
        activities: ["ride", "run", "swim"],  // Possible values "ride", "run", "swim"
        period: "recent",                     // Possible values "recent", "ytd", "all"
        auto_rotate: false,                   // Rotate stats through each period starting from specified period
        locale: config.language,
        units: config.units,
        fade: false,
        fadePoint: 0.1,                       // Start on 1/4th of the list.
        reloadInterval: 5 * 60 * 1000,        // every 5 minutes
        updateInterval: 10 * 1000,            // 10 seconds
        animationSpeed: 2.5 * 1000            // 2.5 seconds
    },

    // Store the strava data in an object.
    stravaData: {
        stats: {},
        activitySummary: {}
    },

    // A loading boolean.
    loading: true,

    // Subclass getStyles method.
    getStyles: function() {
        return ['font-awesome.css','MMM-Strava.css'];
    },

    // Subclass getScripts method.
    getScripts: function() {
        return ["moment.js"];
    },

    // Subclass getTranslations method.
    getTranslations: function() {
        return {
                en: "translations/en.json",
                nl: "translations/nl.json",
                de: "translations/de.json"
        };
    },

    // Subclass start method.
    start: function() {
        Log.info("Starting module: " + this.name);
        if (this.config.period !== "recent" &&
            this.config.period !== "ytd" &&
            this.config.period !== "all")
        {
            this.config.period = "recent";
        }
        this.sendSocketNotification("CONFIG", this.config);
        moment.locale(this.config.locale);
    },

    // Subclass socketNotificationReceived method.
    socketNotificationReceived: function(notification, payload) {
        Log.info("MMM-Strava received a notification:" + notification);
        //Log.info(payload);
        var activityType, i;

        if (notification === "ATHLETE_STATS") {
            var stats = payload;

            for (i = 0; i < this.config.activities.length; i++) {
                activityType = this.config.activities[i].toLowerCase();

                var recentActivityStats = stats["recent_" + activityType + "_totals"];
                if (recentActivityStats) {
                    this.stravaData.stats["recent_" + activityType + "_totals"] = recentActivityStats;
                }
                var ytdActivityStats = stats["ytd_" + activityType + "_totals"];
                if (ytdActivityStats) {
                    this.stravaData.stats["ytd_" + activityType + "_totals"] = ytdActivityStats;
                }
                var allActivityStats = stats["all_" + activityType + "_totals"];
                if (allActivityStats) {
                    this.stravaData.stats["all_" + activityType + "_totals"] = allActivityStats;
                }
            }

            this.loading = false;

            this.scheduleUpdateInterval();

        }

        if (notification === "ATHLETE_ACTIVITY") {
            var activities = payload;
            var activitySummary;

            // Initialise activity summary for the chart
            for (i = 0; i < this.defaults.activities.length; i++) {
                activityType = this.defaults.activities[i].toLowerCase();
                this.stravaData.activitySummary[activityType] = { 
                        total_distance: 0, 
                        total_elevation_gain: 0, 
                        total_moving_time: 0, 
                        dayTotals: [0,0,0,0,0,0,0] 
                    };
            }

            // Summarise athlete activity totals and daily distances
            for (i = 0; i < Object.keys(activities).length - 1; i++) {

                activityType = activities[i].type.toLowerCase();
                var activityDate = moment(activities[i].start_date_local);
                activitySummary = this.stravaData.activitySummary[activityType];

                // Update activity summaries
                activitySummary.total_distance += activities[i].distance;
                activitySummary.total_elevation_gain += activities[i].total_elevation_gain;
                activitySummary.total_moving_time += activities[i].moving_time;
                activitySummary.dayTotals[activityDate.weekday()] += activities[i].distance;
            }

            //Log.info(this.stravaData.activitySummary);
            this.loading = false;
            this.scheduleUpdateInterval();
        }
    },

    // Override dom generator.
    getDom: function() {

        if (this.config.access_token.length <= 0 ||
            this.config.strava_id.length <= 0 ||
            this.config.activities.length <= 0) {
                return this.createMessageDiv(this.translate("CONFIG_MISSING"));
        }

        if (this.loading) {
            return this.createMessageDiv(this.translate("LOADING"));
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
     * createMessageDiv
     * This method creates a div element to display a message.
     * @return {message string}                the message to be displayed
     * @return {dom object}                    a div element containing the message
     */
    createMessageDiv: function(message) {
        var msgWrapper = document.createElement("div");
        msgWrapper.innerHTML = this.translate(message);
        msgWrapper.classList.add("small", "dimmed", "light");
        return msgWrapper;
    },

    /**
     * createChart
     * This method creates a table to display the stats.
     * @return {dom object}                    a div element containing the activity chart
     */
    createActivityChart: function() {
        var chartWrapper = document.createElement("div");
        chartWrapper.className = "small";

        function getNode(n, v) {
          n = document.createElementNS("http://www.w3.org/2000/svg", n);
          for (var p in v)
            n.setAttributeNS(null, p.replace(/[A-Z]/g, function(m, p, o, s) { return "-" + m.toLowerCase(); }), v[p]);
          return n;
        }

        // Add div for each activity type.
        for (var i = 0; i < this.config.activities.length; i++) {
            var activityType = this.config.activities[i];
            var activitySummary = this.stravaData.activitySummary[activityType.toLowerCase()];
            var activityTypeDiv = document.createElement("div");
            activityTypeDiv.className = "week";
            activityTypeDiv.id = activityType.toLowerCase();

                var primaryStatsDiv = document.createElement("div");
                primaryStatsDiv.className = "primary-stats";

                    var actualDistanceSpan = document.createElement("span");
                    actualDistanceSpan.innerHTML = this.roundedToFixed(this.convertToUnits(activitySummary.total_distance), 1) + ((this.config.units.toLowerCase() === "imperial") ? " mi" : " km");
                    actualDistanceSpan.className = "actual small bright";
                    primaryStatsDiv.appendChild(actualDistanceSpan);

                    var inlineStatsList = document.createElement("ul");
                    inlineStatsList.className = "inline-stats";

                        var durationListItem = document.createElement("li");
                        var movingTime = moment.duration(activitySummary.total_moving_time, "seconds");
                        if(this.roundedToFixed(movingTime.asHours(), 1) > 1.0)
                        {
                            durationListItem.innerHTML = this.roundedToFixed(movingTime.asHours(), 0) + "h " + this.roundedToFixed(movingTime.minutes(), 0) + "m";
                        }
                        else
                        {
                            durationListItem.innerHTML = "0h " + this.roundedToFixed(movingTime.minutes(), 0) + "m";
                        }
                        durationListItem.className = "xsmall light";
                        inlineStatsList.appendChild(durationListItem);

                        if (activityType !== "swim") {
                            var elevationListItem = document.createElement("li");
                            elevationListItem.innerHTML = this.roundedToFixed(this.convertToUnits(activitySummary.total_elevation_gain, true), 0) + ((this.config.units.toLowerCase() === "imperial") ? " ft" : " m");
                            elevationListItem.className = "xsmall light";
                            inlineStatsList.appendChild(elevationListItem);
                        }

                    primaryStatsDiv.appendChild(inlineStatsList);

                activityTypeDiv.appendChild(primaryStatsDiv);

                var chartSvg = getNode("svg", {width: 115, height: 68, class: 'chart'});

                var chartG = getNode('g', { class: 'activity-chart', transform: 'translate(25, 5)' });

                var now = moment().startOf('day');
                var startOfWeek = moment().startOf('week');
                var maxDayValue = this.maxArrayValue(activitySummary.dayTotals);
                
                for (var d = 0; d < activitySummary.dayTotals.length; d++) {

                    var barDate = startOfWeek;
                    var barClass = 'past';
                    if (now.diff(barDate, 'days') === 0) {
                        barClass = 'highlighted';
                    } else if (now.diff(barDate, 'days') >= 1) {
                        barClass = 'future';
                    }

                    // bars
                    var barG = getNode('g', { class: 'volume-bar-container', transform: 'translate(' + d * 12.5 + ', 0)' });
                    var barHeight = (activitySummary.dayTotals[d] > 0 ? (activitySummary.dayTotals[d]/maxDayValue * 50) : 2) ;
                    var barY = 50 - barHeight; 
                    var barRect = getNode('rect', { class: 'volume-bar', y: barY, width: 6.571428571428571, height: barHeight});
                    barRect.classList.add(barClass);
                    barG.appendChild(barRect);
                    chartG.appendChild(barG);

                    // labels
                    var labelG = getNode('g', { class: 'day-label-container', transform: 'translate(' + d * 12.5 + ', 63)' });
                    var labelRect = getNode('text', { class: 'day-label', x: 0, y: 0});
                    labelRect.classList.add(barClass);
                    labelRect.innerHTML = barDate.format('dd').slice(0,1);
                    labelG.appendChild(labelRect);
                    chartG.appendChild(labelG);

                    barDate = startOfWeek.add(1, 'days');
                }

                chartSvg.appendChild(chartG);

                activityTypeDiv.appendChild(chartSvg);

                // Icon
                var iconDiv = document.createElement("div");
                iconDiv.classList.add("strava-icon", "icon-lg", "icon-" + activityType.toLowerCase());
                iconDiv.title = activityType.toLowerCase();
                activityTypeDiv.appendChild(iconDiv);

            chartWrapper.appendChild(activityTypeDiv);

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
            var activityTotals = this.stravaData.stats[this.config.period + "_" + activity.toLowerCase() + "_totals"];
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
        var symbol =  document.createElement("div");
        //symbol.className = "fa fa-" + icon;
        symbol.classList.add( "strava-icon", "icon-" + icon);//"fa fa-" + icon;

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
                    self.config.period = ((self.config.period === "recent") ? "ytd" : ((self.config.period === "ytd") ? "all" : "recent"));
                    self.updateDom(self.config.animationSpeed);
                }, this.config.updateInterval);
        }
    },

    /**
     * convertToUnits
     * This method converts the supplied value depending on the value of config.units.
     * @param  {float} _float             the value (in metres) to be converted
     * @param  {boolean} _minor           if _minor, the output will be in feet or metres otherwise it will be in miles or kilometres
     * @return {float}                    the converted value
     */
    convertToUnits: function (_float, _minor){
        if (_minor) {
            // Convert to either feet or inches
            return (this.config.units.toLowerCase() === "imperial") ? _float * 3.281 : _float;
        } else {
            // Convert to either miles or kilometres
            var km = _float * 0.001;
            return (this.config.units.toLowerCase() === "imperial") ? km * 0.621 : km;
        }
    },

    /**
     * roundedToFixed
     * This method rounds the supplied value to the specified number of decimal places.
     * @param  {float} _float            the value to be rounded
     * @param  {number} _digits            the number of decimal places
     * @return {float}                    the rounded value
     */
    roundedToFixed: function (_float, _digits) {
        var rounder = Math.pow(10, _digits);
        return (Math.round(_float * rounder) / rounder).toFixed(_digits);
    },
    
    /**
     * maxArrayValue
     * This method returns the maximum value from an integer array.
     * @param  {array} _array            an array of integer values
     * @return {int}                    the maximum value
     */
    maxArrayValue: function(_array) {
        var max_value = 0;
        for(var i = 0; i < _array.length; i++) {
            if(_array[i] > max_value) {
                max_value = _array[i];
            }
        }
        return max_value;
    }
});
