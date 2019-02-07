'use strict';

var moduleObject;

// Create stubs for MM global variables
global.Module = {
	register: function (name, moduleObjectArgument) {
        moduleObject = moduleObjectArgument;
        moduleObject.config = moduleObjectArgument.defaults;
	}
};

global.config = {
	units: 'metric',
	locale: 'en'
}

global.Log = {
	info: function (message) {
		
	}
}

global.moment = require('moment');

const strava = require('../MMM-Strava.js');

// getPeriodClass
exports.getPeriodClassTest = function (test) {
    test.expect(19);

    var dt = new Date();
    // Days
    moduleObject.config.period = 'recent';
    for (var i = 0; i < 7; i++) {
        var className = dt.getDay() === i ? 'current' : dt.getDay() < i ? 'future' : 'past';
        test.equal(moduleObject.getPeriodClass(i), className);
    }
    // Months
    moduleObject.config.period = 'ytd';
    for (var i = 0; i < 12; i++) {
        var className = dt.getMonth() === i ? 'current' : dt.getMonth() < i ? 'future' : 'past';
        test.equal(moduleObject.getPeriodClass(i), className);
    }
    test.done();
};

// getLabel
exports.getLabelTest = function (test) {
    test.expect(19);
    // Days
    moduleObject.config.period = 'recent';
    test.equal(moduleObject.getLabel(0), 'S');
    test.equal(moduleObject.getLabel(1), 'M');
    test.equal(moduleObject.getLabel(2), 'T');
    test.equal(moduleObject.getLabel(3), 'W');
    test.equal(moduleObject.getLabel(4), 'T');
    test.equal(moduleObject.getLabel(5), 'F');
    test.equal(moduleObject.getLabel(6), 'S');
    // Months
    moduleObject.config.period = 'ytd';
    test.equal(moduleObject.getLabel(0), 'J');
    test.equal(moduleObject.getLabel(1), 'F');
    test.equal(moduleObject.getLabel(2), 'M');
    test.equal(moduleObject.getLabel(3), 'A');
    test.equal(moduleObject.getLabel(4), 'M');
    test.equal(moduleObject.getLabel(5), 'J');
    test.equal(moduleObject.getLabel(6), 'J');
    test.equal(moduleObject.getLabel(7), 'A');
    test.equal(moduleObject.getLabel(8), 'S');
    test.equal(moduleObject.getLabel(9), 'O');
    test.equal(moduleObject.getLabel(10), 'N');
    test.equal(moduleObject.getLabel(11), 'D');
    test.done();
};

// formatTime
exports.formatTimeTest = function (test) {
    test.expect(2);
    test.equal(moduleObject.formatTime(9912), "2h 45m");
    test.equal(moduleObject.formatTime(94320), "26h 12m");
    test.done();
};

// formatDistance
exports.formatDistanceTest = function (test) {
    test.expect(8);
    moduleObject.config.units = 'metric';
    test.equal(moduleObject.formatDistance(8000, 0, false), "8", "8000 m should equal 8 (km) when shown to 0 decimal places");
    test.equal(moduleObject.formatDistance(8000, 0, true), "8 km", "8000 m should equal 8 km when shown to 0 decimal places");
    test.equal(moduleObject.formatDistance(8800, 1, false), "8.8", "8800 m should equal 8.8 (km) when shown to 1 decimal place");
    test.equal(moduleObject.formatDistance(8800, 1, true), "8.8 km", "8800 m should equal 8.8 km when shown to 1 decimal place");
    moduleObject.config.units = 'imperial';
    test.equal(moduleObject.formatDistance(8000, 0, false), "5", "8000 m should equal 5 (mi) when shown to 1 decimal places");
    test.equal(moduleObject.formatDistance(8000, 0, true), "5 mi", "8000 m should equal 5 mi when shown to 1 decimal places");
    test.equal(moduleObject.formatDistance(8800, 1, false), "5.5", "8800 m should equal 5.5 (mi) when shown to 1 decimal place");
    test.equal(moduleObject.formatDistance(8800, 1, true), "5.5 mi", "8800 m should equal 5.5 mi when shown to 1 decimal place");
    test.done();
};

// formatElevation
exports.formatElevationTest = function (test) {
    test.expect(8);
    moduleObject.config.units = 'metric';
    test.equal(moduleObject.formatElevation(8000, 0, false), "8000", "8000 m should equal 8 (m) when shown to 0 decimal places");
    test.equal(moduleObject.formatElevation(8000, 0, true), "8000 m", "8000 m should equal 8 m when shown to 0 decimal places");
    test.equal(moduleObject.formatElevation(8800, 1, false), "8800.0", "8800 m should equal 8800.0 (m) when shown to 1 decimal place");
    test.equal(moduleObject.formatElevation(8800, 1, true), "8800.0 m", "8800 m should equal 8800.0 m when shown to 1 decimal place");
    moduleObject.config.units = 'imperial';
    test.equal(moduleObject.formatElevation(8000, 0, false), "26247", "8000 m should equal 26247 (ft) when shown to 1 decimal places");
    test.equal(moduleObject.formatElevation(8000, 0, true), "26247 ft", "8000 m should equal 26247 ft when shown to 1 decimal places");
    test.equal(moduleObject.formatElevation(8000, 1, false), "26246.7", "8800 m should equal 26246.7 (ft) when shown to 1 decimal place");
    test.equal(moduleObject.formatElevation(8000, 1, true), "26246.7 ft", "8800 m should equal 26246.7 ft when shown to 1 decimal place");
    test.done();
};

// roundValue
exports.roundValueTest = function (test) {
    test.expect(4);
    test.equal(moduleObject.roundValue(0.81,1), 0.8);
    test.equal(moduleObject.roundValue(1.15,1), 1.2);
    test.equal(moduleObject.roundValue(13.3,0), 13);
    test.equal(moduleObject.roundValue(145.9,0), 146);
    test.done();
};
