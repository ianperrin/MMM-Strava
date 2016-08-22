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

exports['test'] = {
  'phony ok test': function(test) {
    test.expect(1);
    test.ok(true);
    test.done();
  },
  'phony equals test': function(test) {
    test.expect(1);
    test.equal(1, 1);
    test.done();
  }
};