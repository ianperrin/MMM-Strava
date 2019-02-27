/* global require, describe, it */

var strava = require("../strava_api.js");
var assert = require("assert");

describe("Strava API", function () {
    describe("#strava.oauth.getRequestAccessURL()", function () {
        var args = {
            "client_id": 12345,
            "redirect_uri": "http://www.example.com/",
            "approval_prompt": "force",
            "scope": "read,activity:read,activity:read_all"
        };
        it("should return expected redirect url", function (done) {
            assert.equal(strava.oauth.getRequestAccessURL(args), "https://www.strava.com/oauth/authorize?client_id=12345&redirect_uri=http%3A%2F%2Fwww.example.com%2F&response_type=code&scope=read%2Cactivity%3Aread%2Cactivity%3Aread_all&approval_prompt=force");
            done();
        });

    });
});
