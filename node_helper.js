/**
 * @file node_helper.js
 *
 * @author ianperrin
 * @license MIT
 *
 * @see  http://github.com/ianperrin/MMM-Strava
 */

/**
 * @external node_helper
 * @see https://github.com/MichMich/MagicMirror/blob/master/modules/node_modules/node_helper/index.js
 */
const NodeHelper = require("node_helper");
/**
 * @external moment
 * @see https://www.npmjs.com/package/moment
 */
const moment = require("moment");
/**
 * @external strava-v3
 * @see https://www.npmjs.com/package/strava-v3
 */
const strava = require("strava-v3");

/**
 * @alias fs
 * @see {@link http://nodejs.org/api/fs.html File System}
 */
const fs = require("fs");
/**
 * @module node_helper
 * @description Backend for the module to query data from the API provider.
 *
 * @requires external:node_helper
 * @requires external:moment
 * @requires external:strava-v3
 * @requires alias:fs
 */
module.exports = NodeHelper.create({
	/**
	 * @function start
	 * @description Logs a start message to the console.
	 * @override
	 */
	start: function () {
		console.log("Starting module helper: " + this.name);
		this.createRoutes();
	},
	// Set the minimum MagicMirror module version for this module.
	requiresVersion: "2.2.0",
	// Config store e.g. this.configs["identifier"])
	configs: Object.create(null),
	// Tokens file path
	tokensFile: `${__dirname}/tokens.json`,
	// Token store e.g. this.tokens["client_id"])
	tokens: Object.create(null),
	/**
	 * @function socketNotificationReceived
	 * @description receives socket notifications from the module.
	 * @override
	 *
	 * @param {string} notification - Notification name
	 * @param {object.<string, object>} payload - Detailed payload of the notification (key: module identifier, value: config object).
	 */
	socketNotificationReceived: function (notification, payload) {
		var self = this;
		this.log("Received notification: " + notification);
		if (notification === "SET_CONFIG") {
			// debug?
			if (payload.config.debug) {
				this.debug = true;
			}
			// Validate module config
			if (payload.config.access_token || payload.config.strava_id) {
				this.log(`Legacy config in use for ${payload.identifier}`);
				this.sendSocketNotification("WARNING", { identifier: payload.identifier, data: { message: "Strava authorisation has changed. Please update your config." } });
			}
			// Initialise and store module config
			if (!(payload.identifier in this.configs)) {
				this.configs[payload.identifier] = {};
			}
			this.configs[payload.identifier].config = payload.config;
			// Check for token authorisations
			this.readTokens();
			if (payload.config.client_id && !(payload.config.client_id in this.tokens)) {
				this.log(`Unauthorised client id for ${payload.identifier}`);
				this.sendSocketNotification("ERROR", { identifier: payload.identifier, data: { message: `Client id unauthorised - please visit <a href="/${self.name}/auth/">/${self.name}/auth/</a>` } });
			}
			// Schedule API calls
			this.getData(payload.identifier);
			setInterval(function () {
				self.getData(payload.identifier);
			}, payload.config.reloadInterval);
		}
	},
	/**
	 * @function createRoutes
	 * @description Creates the routes for the authorisation flow.
	 */
	createRoutes: function () {
		this.expressApp.get(`/${this.name}/auth/modules`, this.authModulesRoute.bind(this));
		this.expressApp.get(`/${this.name}/auth/request`, this.authRequestRoute.bind(this));
		this.expressApp.get(`/${this.name}/auth/exchange`, this.authExchangeRoute.bind(this));
	},
	/**
	 * @function authModulesRoute
	 * @description returns a list of module identifiers
	 *
	 * @param {object} req
	 * @param {object} res - The HTTP response that an Express app sends when it gets an HTTP request.
	 */
	authModulesRoute: function (req, res) {
		try {
			var identifiers = Object.keys(this.configs);
			identifiers.sort();
			var text = JSON.stringify(identifiers);
			res.contentType("application/json");
			res.send(text);
		} catch (error) {
			this.log(error);
			res.redirect(`/${this.name}/auth/?error=${JSON.stringify(error)}`);
		}
	},
	/**
	 * @function authRequestRoute
	 * @description redirects to the Strava Request Access Url
	 *
	 * @param {object} req
	 * @param {object} res - The HTTP response the Express app sends when it gets an HTTP request.
	 */
	authRequestRoute: function (req, res) {
		try {
			const moduleIdentifier = req.query.module_identifier;
			const clientId = this.configs[moduleIdentifier].config.client_id;
			const redirectUri = `http://${req.headers.host}/${this.name}/auth/exchange`;
			this.log(`Requesting access for ${clientId}`);
			// Set Strava config
			strava.config({
				client_id: clientId,
				redirect_uri: redirectUri
			});
			const args = {
				client_id: clientId,
				redirect_uri: redirectUri,
				approval_prompt: "force",
				scope: "read,activity:read,activity:read_all",
				state: moduleIdentifier
			};
			const url = strava.oauth.getRequestAccessURL(args);
			res.redirect(url);
		} catch (error) {
			this.log(error);
			res.redirect(`/${this.name}/auth/?error=${JSON.stringify(error)}`);
		}
	},
	/**
	 * @function authExchangeRoute
	 * @description exchanges code obtained from the access request and stores the access token
	 *
	 * @param {object} req
	 * @param {object} res - The HTTP response that an Express app sends when it gets an HTTP request.
	 */
	authExchangeRoute: function (req, res) {
		try {
			const authCode = req.query.code;
			const moduleIdentifier = req.query.state;
			const clientId = this.configs[moduleIdentifier].config.client_id;
			const clientSecret = this.configs[moduleIdentifier].config.client_secret;
			this.log(`Getting token for ${clientId}`);
			strava.config({
				client_id: clientId,
				client_secret: clientSecret
			});
			var self = this;
			strava.oauth.getToken(authCode, function (err, payload, limits) {
				if (err) {
					console.error(err);
					res.redirect(`/${self.name}/auth/?error=${err}`);
					return;
				}
				// Store tokens
				self.saveToken(clientId, payload.body, (err, data) => {
					// redirect route
					res.redirect(`/${self.name}/auth/?status=success`);
				});
			});
		} catch (error) {
			this.log(error);
			res.redirect(`/${this.name}/auth/?error=${JSON.stringify(error)}`);
		}
	},
	/**
	 * @function refreshTokens
	 * @description refresh the authenitcation tokens from the API and store
	 *
	 * @param {string} moduleIdentifier - The module identifier.
	 */
	refreshTokens: function (moduleIdentifier) {
		this.log(`Refreshing tokens for ${moduleIdentifier}`);
		var self = this;
		const clientId = this.configs[moduleIdentifier].config.client_id;
		const clientSecret = this.configs[moduleIdentifier].config.client_secret;
		const token = this.tokens[clientId].token;
		this.log(`Refreshing token for ${clientId}`);
		strava.config({
			client_id: clientId,
			client_secret: clientSecret
		});
		try {
			strava.oauth.refreshToken(token.refresh_token).then((result) => {
				token.token_type = result.token_type || token.token_type;
				token.access_token = result.access_token || token.access_token;
				token.refresh_token = result.refresh_token || token.refresh_token;
				token.expires_at = result.expires_at || token.expires_at;
				// Store tokens
				self.saveToken(clientId, token, (err, data) => {
					if (!err) {
						self.getData(moduleIdentifier);
					}
				});
			});
		} catch (error) {
			this.log(`Failed to refresh tokens for ${moduleIdentifier}. Check config or module authorisation.`);
		}
	},
	/**
	 * @function getData
	 * @description gets data from the Strava API based on module mode
	 *
	 * @param {string} moduleIdentifier - The module identifier.
	 */
	getData: function (moduleIdentifier) {
		this.log(`Getting data for ${moduleIdentifier}`);
		const moduleConfig = this.configs[moduleIdentifier].config;
		try {
			// Get access token
			const accessToken = this.tokens[moduleConfig.client_id].token.access_token;
			if (moduleConfig.mode === "table") {
				try {
					// Get athelete Id
					const athleteId = this.tokens[moduleConfig.client_id].token.athlete.id;
					// Call api
					this.getAthleteStats(moduleIdentifier, accessToken, athleteId);
				} catch (error) {
					this.log(`Athete id not found for ${moduleIdentifier}`);
				}
			} else if (moduleConfig.mode === "chart") {
				// Get initial date based on period
				moment.locale(moduleConfig.locale);
				const afterPeriodMap = {
					all: moment().year(moduleConfig.firstYear).month(0).date(1).hours(0).minutes(0).seconds(0).milliseconds(0).unix(),
					ytd: moment().startOf("year").unix(),
					recent: moment().startOf("week").unix()
				};
				var after = afterPeriodMap[moduleConfig.period];
				// Call api
				this.getAthleteActivities(moduleIdentifier, accessToken, after);
			}
		} catch (error) {
			this.log(`Access token not found for ${moduleIdentifier}`);
		}
	},
	/**
	 * @function getAthleteStats
	 * @description get stats for an athlete from the API
	 *
	 * @param {string} moduleIdentifier - The module identifier.
	 * @param {string} accessToken
	 * @param {integer} athleteId
	 */
	getAthleteStats: async function (moduleIdentifier, accessToken, athleteId) {
		this.log("Getting athlete stats for " + moduleIdentifier + " using " + athleteId);
		var self = this;
		const errors = require("request-promise/errors");
		const options = {
			access_token: accessToken,
			id: athleteId
		};
		const apiData = await strava.athletes.stats(options).catch(errors.StatusCodeError, function (e) {
			self.handleApiError(moduleIdentifier, e);
		});
		if (apiData) {
			self.sendSocketNotification("DATA", { identifier: moduleIdentifier, data: apiData });
		}
	},
	/**
	 * @function getAthleteActivities
	 * @description get logged in athletes activities from the API
	 *
	 * @param {string} moduleIdentifier - The module identifier.
	 * @param {string} accessToken
	 * @param {string} after
	 */
	getAthleteActivities: async function (moduleIdentifier, accessToken, after) {
		this.log("Getting athlete activities for " + moduleIdentifier + " after " + moment.unix(after).format("YYYY-MM-DD"));
		const self = this;
		var pageNum = 1;
		var isPaging = true;
		var sendNotification = true;
		const activityList = [];
		const errors = require("request-promise/errors");
		while (isPaging) {
			const options = {
				access_token: accessToken,
				after: after,
				page: pageNum,
				per_page: 200
			};
			const apiData = await strava.athlete.listActivities(options).catch(errors.StatusCodeError, function (e) {
				self.handleApiError(moduleIdentifier, e);
				sendNotification = false;
			});
			if (apiData && apiData.length > 0) {
				this.log("listActivities api returned " + apiData.length + " activities in page " + options.page + " using " + options.per_page + " per page.");
				activityList.push(...apiData);
				pageNum += 1;
			} else {
				isPaging = false;
				break;
			}
		}
		// Prepare and send notification payload
		if (sendNotification) {
			var data = {
				identifier: moduleIdentifier,
				data: this.summariseActivities(moduleIdentifier, activityList)
			};
			this.sendSocketNotification("DATA", data);
		}
	},
	/**
	 * @function handleApiError
	 * @description handles an error response from the API.
	 *
	 * @param {string} moduleIdentifier - The module identifier.
	 * @param {StatusCodeError} err
	 */
	handleApiError: function (moduleIdentifier, err) {
		try {
			// Strava-v3 errors - https://github.com/UnbounDev/node-strava-v3#error-handling
			if (err) {
				if (err.error && err.error.errors && err.error.errors[0].field === "access_token" && err.error.errors[0].code === "invalid") {
					this.log(`Invalid access token for ${moduleIdentifier}, will try refreshing tokens.`);
					this.refreshTokens(moduleIdentifier);
				} else {
					this.log({ module: moduleIdentifier, error: err });
					this.sendSocketNotification("ERROR", { identifier: moduleIdentifier, data: { message: err.message } });
				}
			} else {
				this.log("No error to handle.");
			}
		} catch (error) {
			// Unknown response
			this.log(`Unable to handle API error for ${moduleIdentifier}.`);
		}
		return false;
	},
	/**
	 * @function summariseActivities
	 * @param activityList
	 * @description summarises a list of activities for display in the chart.
	 * @param {string} moduleIdentifier - The module identifier.
	 */
	summariseActivities: function (moduleIdentifier, activityList) {
		this.log("Summarising athlete activities for " + moduleIdentifier);
		var moduleConfig = this.configs[moduleIdentifier].config;
		var activitySummary = Object.create(null);
		var activityName;
		// Initialise activity summary
		const periodIntervalMap = {
			all: [...Array(moment().year() - moduleConfig.firstYear + 1).keys()].map((i) => i + moduleConfig.firstYear),
			ytd: moment.monthsShort(),
			recent: moment.weekdaysShort()
		};
		var periodIntervals = periodIntervalMap[moduleConfig.period];
		for (var activity in moduleConfig.activities) {
			if (Object.prototype.hasOwnProperty.call(moduleConfig.activities, activity)) {
				activityName = moduleConfig.activities[activity].toLowerCase().replace("virtual", "");
				activitySummary[activityName] = {
					total_activity_count: 0,
					total_distance: 0,
					total_elevation_gain: 0,
					total_moving_time: 0,
					total_elapsed_time: 0,
					total_achievement_count: 0,
					max_interval_distance: 0,
					intervals: Array(periodIntervals.length).fill(0)
				};
			}
		}
		// Summarise activity totals and interval totals
		for (var i = 0; i < Object.keys(activityList).length; i++) {
			// Merge virtual activities
			activityName = activityList[i].type.toLowerCase().replace("virtual", "");
			var activityTypeSummary = activitySummary[activityName];
			// Update activity summaries
			if (activityTypeSummary) {
				var distance = activityList[i].distance;
				activityTypeSummary.total_activity_count += 1;
				activityTypeSummary.total_distance += distance;
				activityTypeSummary.total_elevation_gain += activityList[i].total_elevation_gain;
				activityTypeSummary.total_moving_time += activityList[i].moving_time;
				activityTypeSummary.total_elapsed_time += activityList[i].elapsed_time;
				activityTypeSummary.total_achievement_count += activityList[i].achievement_count;
				const activityDate = moment(activityList[i].start_date_local);
				const intervalIndexMap = {
					all: activityDate.year() - moduleConfig.firstYear,
					ytd: activityDate.month(),
					recent: activityDate.weekday()
				};
				const intervalIndex = intervalIndexMap[moduleConfig.period];
				activityTypeSummary.intervals[intervalIndex] += distance;
				// Update max interval distance
				if (activityTypeSummary.intervals[intervalIndex] > activityTypeSummary.max_interval_distance) {
					activityTypeSummary.max_interval_distance = activityTypeSummary.intervals[intervalIndex];
				}
			}
		}
		return activitySummary;
	},
	/**
	 * @function saveToken
	 * @description save token for specified client id to file
	 * @param cb
	 * @param {integer} clientId - The application's ID, obtained during registration.
	 * @param {object} token - The token response.
	 */
	saveToken: function (clientId, token, cb) {
		var self = this;
		this.readTokens();
		// No token for clientId - delete existing
		if (clientId in this.tokens && !token) {
			delete this.tokens[clientId];
		}
		// No clientId in tokens - create stub
		if (!(clientId in this.tokens) && token) {
			this.tokens[clientId] = {};
		}
		// Add token for client
		if (token) {
			this.tokens[clientId].token = token;
		}
		// Save tokens to file
		var json = JSON.stringify(this.tokens, null, 2);
		fs.writeFile(this.tokensFile, json, "utf8", function (error) {
			if (error && cb) {
				cb(error);
			}
			if (cb) {
				cb(null, self.tokens);
			}
		});
	},
	/**
	 * @function readTokens
	 * @description reads the current tokens file
	 */
	readTokens: function () {
		if (this.tokensFile) {
			try {
				const tokensData = fs.readFileSync(this.tokensFile, "utf8");
				this.tokens = JSON.parse(tokensData);
			} catch (error) {
				this.tokens = {};
			}
			return this.tokens;
		}
	},
	/**
	 * @function log
	 * @description logs the message, prefixed by the Module name, if debug is enabled.
	 * @param  {string} msg            the message to be logged
	 */
	log: function (msg) {
		if (this.debug) {
			console.log(this.name + ":", JSON.stringify(msg));
		}
	}
});
