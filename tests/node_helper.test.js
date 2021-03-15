const moduleAlias = require("module-alias");
moduleAlias.addAlias("node_helper", "../../js/node_helper.js");
var Module = require("../node_helper.js");
var helper = new Module();
helper.setName("MMM-Strava");

var assert = require("assert");
describe("Node Helper", function () {
	var tokenSample = { unit: "test" };
	var tokenSample2 = { unit: "test", add: "this" };
	var clientIdSample = "12345";
	describe("#readTokens()", function () {
		var tokens = helper.readTokens();
		it("should always return an object", function (done) {
			assert.equal(typeof tokens, "object");
			done();
		});
		it("not contain the sample client id", function (done) {
			assert.equal(tokens[clientIdSample], undefined);
			done();
		});
	});
	describe("#saveToken()", function () {
		it("should return tokens for the sample client id", function (done) {
			helper.saveToken(clientIdSample, tokenSample, function (err, data) {
				if (err) {
					done(err);
				} else {
					assert.equal(typeof data, "object");
					assert.deepEqual(data[clientIdSample], { token: tokenSample });
					done();
				}
			});
		});
		it("should update tokens for the sample client id", function (done) {
			helper.saveToken(clientIdSample, tokenSample2, function (err, data) {
				if (err) {
					done(err);
				} else {
					assert.equal(typeof data, "object");
					assert.deepEqual(data[clientIdSample], { token: tokenSample2 });
					done();
				}
			});
		});
		it("should remove the tokens for the sample client id", function (done) {
			helper.saveToken(clientIdSample, undefined, function (error, data) {
				if (error) {
					done(error);
				} else {
					assert.equal(typeof data, "object");
					assert.equal(data[clientIdSample], undefined);
					done();
				}
			});
		});
	});
});
