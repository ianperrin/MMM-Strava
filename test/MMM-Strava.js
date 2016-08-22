'use strict';

var moduleObject;

global.Module = {
	register: function (name, moduleObjectArgument) {
		moduleObject = moduleObjectArgument;
	}
};

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