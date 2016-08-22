'use strict';

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