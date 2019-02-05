'use strict';

var moduleObject;

// Create stubs for MM global variables
global.Module = {
	register: function (name, moduleObjectArgument) {
		moduleObject = moduleObjectArgument;
	}
};

global.config = {
	units: 'imperial'
}

global.Log = {
	info: function (message) {
		
	}
}

var strava = require('../MMM-Strava.js');

// roundValue
exports.roundValueTest = function (test) {
    test.expect(2);
    test.equal(moduleObject.roundValue(1.15,1), 1.2);
    test.equal(moduleObject.roundValue(145.9,0), 146);
    test.done();
};
