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

// roundedToFixed
exports.roundedToFixedTest = function (test) {
    test.expect(2);
    console.log(typeof moduleObject);
    test.equal(moduleObject.roundedToFixed(1.15,1), 1.2);
    test.equal(moduleObject.roundedToFixed(145.9,0), 146);
    test.done();
};
