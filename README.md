# MagicMirror Module: MMM-Strava

A MagicMirror Module for displaying your Strava data.

[![License](https://img.shields.io/badge/license-MIT-blue.svg)](https://raw.githubusercontent.com/ianperrin/MMM-Strava/master/LICENSE)
[![Build Status](https://travis-ci.org/ianperrin/MMM-Strava.svg?branch=master)](https://travis-ci.org/ianperrin/MMM-Strava)
[![Code Climate](https://codeclimate.com/github/ianperrin/MMM-Strava/badges/gpa.svg)](https://codeclimate.com/github/ianperrin/MMM-Strava)
[![Known Vulnerabilities](https://snyk.io/test/github/ianperrin/MMM-Strava/badge.svg)](https://snyk.io/test/github/ianperrin/MMM-Strava)

## Example

![Table mode screenshot](.github/example.gif) ![Chart mode screenshot](.github/example-2.png)

### The module displays activity information in one of two modes

* `table` mode, which includes
  * The number of activities for the period.
  * The total distance for the period.
  * The total elevation gain for the period. (optional)
  * The total moving time for the period. (optional)
  * The total elapsed time for the period. (optional)
  * The total number of achievements (recent period only).
* `chart` mode, which includes
  * The total distance, moving time and elevation for the last week.
  * A chart showing the total distance by day (for `recent` period) or month (for `ytd` period).

### In addition you can configure the following options

* Which `activities` (and the order activities) should be displayed.
* Which `stats` should be displayed in `table` mode.
* Which `period` to display stats for your activities: Recent (last 4 weeks in `table` mode or current week in `chart` mode), year to date or all time (only applicable in `table` mode).
* Whether the module should rotate through the different periods, and the interval between rotations. (only applicable in `table` mode)
* The units (miles/feet or kilometres/metres) used to display the total distance and elevation gain for each activity.
* The locale used for determining the date (day or month) labels in the chart.

## Installation

Clone this repository into your MagicMirror's Module folder:

````bash
cd ~/MagicMirror/modules
git clone https://github.com/ianperrin/MMM-Strava.git
npm install --production
````

Configure the module in your `config/config.js` file.

## Updating the module

To update the module to the latest version, pull the changes from this repository into the MMM-Strava folder:

````bash
cd ~/MagicMirror/modules/MMM-Strava
git pull
npm install --production
````

If you haven't changed the module, this should work without any problems.
Type `git status` to see your changes, if there are any, you can reset them with `git reset --hard`. After that, `git pull` should be possible.

## Using the module

To use this module, add it to the modules array in the `config/config.js` file:

````javascript
modules: [
    {
        module: 'MMM-Strava',
        position: 'top_right',
        config: {
            strava_id: 'your_strava_id',
            access_token: 'your_strava_api_access_token'
        }
    }
]
````

## Configuration options

The following properties can be configured:

| **Option** | **Default** | **Description** | **Possible Values** |
| --- | --- | --- | --- |
| `strava_id` |  | *Required* - Your Strava ID. Obtained from [your My Profile page](https://support.strava.com/hc/en-us/articles/216928797-Where-do-i-find-my-Strava-ID-). |  |
| `access_token` |  | *Required* - Your Strava API Access Token. Obtained from [your My API Application page](https://www.strava.com/settings/api). |  |
| `mode` | `table` | *Optional* - Determines which mode should be used to display activity information. | `"table"`, `"chart"` |
| `activities` | `["ride", "run", "swim"]` | *Optional* - Determines which activities to display and in which order they are displayed. *Note:* - The activities can be listed in any order, and only one is required. However, they must be entered as an array of strings i.e. comma separated values within square brackets. | `"ride"`, `"run"`, `"swim"` |
| `period` | `recent` | *Optional* - What period should be used to summarise the activities in `table` mode. | `recent` = recent (last 4 weeks), `ytd` = year to date, `all` = all time |
| `stats` | `["count", "distance", "achievements"]` | *Optional* - Determines which statistics to display in `table` mode. *Note:* - The stats can be listed in any order, and only one is required. However, they must be entered as an array of strings i.e. comma separated values within square brackets. | `"count"`, `"distance"`, `"elevation"`, `"moving_time"`, `"elapsed_time"`, `"acheivements"` |
| `auto_rotate` | `false` | *Optional* - Whether the summary of activities should rotate through the different periods in `table` mode. | `true` = rotates the summary through the different periods, `false` = displays the specified period only. |
| `units` | `config.units` | *Optional* - What units to use. Specified by config.js | *Possible values:* `config.units` = Specified by config.js, `metric` = Kilometres/Metres, `imperial` = Miles/Feet |
| `fade` | `false` | *Optional* - Whether to fade the activities to black. (Gradient) | *Possible values:* `true` or `false` |
| `fadePoint` | `0.1` | *Optional* - Where to start fade? | *Possible values:* `0` (top of the list) - `1` (bottom of list) |
| `updateInterval` | `10000` (10 seconds) | *Optional* - How often does the period have to change? (Milliseconds). | *Possible values:* `1000` - `86400000` |
| `reloadInterval` | `300000` (5 minutes) | *Optional* - How often does the data needs to be reloaded from the API? (Milliseconds). See [Strava documentation](http://strava.github.io/api/#rate-limiting) for API rate limits | `7500` - `86400000` |
| `animationSpeed` | `2500` | *Optional* - The speed of the update animation. (Milliseconds) | `0` - `5000` |
| `locale` | `config.language` | *Optional* - The locale to be used for displaying dates - e.g. the days of the week or months or the year in chart mode. If omitted, the config.language will be used. | e.g. `en`, `en-gb`, `fr` etc |
| `debug` | `false` | *Optional* - Outputs extended logging to the console/log | `true` = enables extended logging, `false` = disables extended logging |

### Private activities

The access token retrieved via the `My API Application` page can only read public activities. To allow the module to access to `private` activities, follow the steps below:

1. Using a browser on your computer, go to the [My API Application](https://www.strava.com/settings/api) page in your Strava profile
2. On the My API Application page, locate and make a note of your `Client ID` and `Client Secret` (you will need to click the *show* link to reveal the client secret).
3. Using the `Client ID` obtained in step 2, replace `XXXXX` in the following URL: `http://www.strava.com/oauth/authorize?client_id=XXXXX&response_type=code&redirect_uri=http://localhost/exchange_token&approval_prompt=force&scope=view_private` then go to the URL in a browser on your computer
4. If prompted, login, then Authorize the request
5. You will then be redirected to and error (404) page. This is expected so don't panic. Copy the authentication code from the browsers address bar. The address will look something like `http://localhost/exchange_token?state=&code=c498932e64136c8991a3fb31e3d1dfdf2f859357` - you need everything after `code=`
6. Using the `client id` and `client secret` obtained in step 2 above and the `code` obtained in step 5, replace the respective values in the following command `curl -X POST https://www.strava.com/oauth/token -F client_id=XXXXX -F client_secret=YYYYY -F code=ZZZZZ`
7. Using terminal on the Pi or via SSH, run the command
8. Copy the `access_token` from the result and use it to update the module configuration in the config.js file