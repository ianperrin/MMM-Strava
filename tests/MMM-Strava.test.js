/* global global, require, describe, it */

var moduleObject;
var assert = require("assert");
// Create stubs for MM global variables
global.config = {
    units: "metric",
    locale: "en"
};
global.Log = {
    info: function (message) {}
};
global.moment = require("moment");
global.Module = {
    register: function (name, moduleObjectArgument) {
        moduleObject = moduleObjectArgument;
        moduleObject.config = moduleObjectArgument.defaults;
        moduleObject.config.locale = global.config.locale;
    }
};
// Core module file
require("../MMM-Strava.js");
// Tests
describe("MMM-Strava", function () {
    var dt = new Date();
    describe("#getIntervalClass() - recent", function () {
        var dayIntervals = [0,1,2,3,4,5,6];
        var currentDay = dt.getDay();
        dayIntervals.forEach(function (day) {
            var className = (currentDay === day ? "current" : currentDay < day ? "future" : "past");
            it("class name for day interval " + day + " should be " + className + " when today is " +  currentDay, function () {
                moduleObject.config.period = "recent";
                assert.equal(moduleObject.getIntervalClass(day), className);
            });
        });
    });
    describe("#getIntervalClass() - ytd", function () {
        var months = [0,1,2,3,4,5,6,7,8,9,10,11];
        var currentMonth = dt.getMonth();
        months.forEach(function (month) {
            var className = currentMonth === month ? "current" : currentMonth < month ? "future" : "past";
            it("class name for month interval " + month + " should be " + className + " when todays month is " +  currentMonth, function () {
                moduleObject.config.period = "ytd";
                assert.equal(moduleObject.getIntervalClass(month), className);
            });
        });
    });
    describe("#getIntervalLabel() - recent", function () {
        var dayIntervals = [0,1,2,3,4,5,6];
        var dayLabels = ["S","M","T","W","T","F","S"];
        dayIntervals.forEach(function (day) {
            it("label for day interval " + day + " should be " + dayLabels[day], function () {
                moduleObject.config.period = "recent";
                assert.equal(moduleObject.getLabel(day), dayLabels[day]);
            });
        });
    });
    describe("#getIntervalLabel() - ytd", function () {
        var monthIntervals = [0,1,2,3,4,5,6,7,8,9,10,11];
        var monthLabels = ["J","F","M","A","M","J","J","A","S","O","N","D"];
        monthIntervals.forEach(function (month) {
            it("label for month interval " + month + " should be " + monthLabels[month], function () {
                moduleObject.config.period = "ytd";
                assert.equal(moduleObject.getLabel(month), monthLabels[month]);
            });
        });
    });
    describe("#formatTime()", function () {
        it("times in seconds should be successfully humanised", function () {
            assert.equal(moduleObject.formatTime(9912), "2h 45m");
            assert.equal(moduleObject.formatTime(94320), "26h 12m");
        });
    });
    describe("#formatDistance()", function () {
        it("distances in metres should be successfully humanised to metric", function () {
            moduleObject.config.units = "metric";
            assert.equal(moduleObject.formatDistance(8000, 0, false), "8", "8000 m should equal 8 (km) when shown to 0 decimal places");
            assert.equal(moduleObject.formatDistance(8000, 0, true), "8 km", "8000 m should equal 8 km when shown to 0 decimal places");
            assert.equal(moduleObject.formatDistance(8800, 1, false), "8.8", "8800 m should equal 8.8 (km) when shown to 1 decimal place");
            assert.equal(moduleObject.formatDistance(8800, 1, true), "8.8 km", "8800 m should equal 8.8 km when shown to 1 decimal place");
        });
        it("distances in metres should be successfully humanised to imperial", function () {
            moduleObject.config.units = "imperial";
            assert.equal(moduleObject.formatDistance(8000, 0, false), "5", "8000 m should equal 5 (mi) when shown to 1 decimal places");
            assert.equal(moduleObject.formatDistance(8000, 0, true), "5 mi", "8000 m should equal 5 mi when shown to 1 decimal places");
            assert.equal(moduleObject.formatDistance(8800, 1, false), "5.5", "8800 m should equal 5.5 (mi) when shown to 1 decimal place");
            assert.equal(moduleObject.formatDistance(8800, 1, true), "5.5 mi", "8800 m should equal 5.5 mi when shown to 1 decimal place");
        });
    });
    describe("#formatElevation()", function () {
        it("elevations in metres should be successfully humanised to metric", function () {
            moduleObject.config.units = "metric";
            assert.equal(moduleObject.formatElevation(8000, 0, false), "8000", "8000 m should equal 8 (m) when shown to 0 decimal places");
            assert.equal(moduleObject.formatElevation(8000, 0, true), "8000 m", "8000 m should equal 8 m when shown to 0 decimal places");
            assert.equal(moduleObject.formatElevation(8800, 1, false), "8800.0", "8800 m should equal 8800.0 (m) when shown to 1 decimal place");
            assert.equal(moduleObject.formatElevation(8800, 1, true), "8800.0 m", "8800 m should equal 8800.0 m when shown to 1 decimal place");
        });
        it("elevations in metres should be successfully humanised to imperial", function () {
            moduleObject.config.units = "imperial";
            assert.equal(moduleObject.formatElevation(8000, 0, false), "26247", "8000 m should equal 26247 (ft) when shown to 1 decimal places");
            assert.equal(moduleObject.formatElevation(8000, 0, true), "26247 ft", "8000 m should equal 26247 ft when shown to 1 decimal places");
            assert.equal(moduleObject.formatElevation(8000, 1, false), "26246.7", "8000 m should equal 26246.7 (ft) when shown to 1 decimal place");
            assert.equal(moduleObject.formatElevation(8000, 1, true), "26246.7 ft", "8000 m should equal 26246.7 ft when shown to 1 decimal place");
        });
    });
    describe("#roundValue()", function () {
        it("numeric values should be successfully rounded to the correct number of decimal places", function () {
            assert.equal(moduleObject.roundValue(0.81,1), 0.8);
            assert.equal(moduleObject.roundValue(1.15,1), 1.2);
            assert.equal(moduleObject.roundValue(13.3,0), 13);
            assert.equal(moduleObject.roundValue(145.9,0), 146);
        });
    });
});
