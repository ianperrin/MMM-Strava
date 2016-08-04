# MagicMirror Module: MMM-Strava
A MagicMirror Module for your Strava data.

## Example

![](.github/example.gif)

### The module displays the following information:
* The number of activities for the period.
* The total distance for the period.
* The total number of achievements (recent period only).

### In addition you can configure the following options
* Which period to display stats for your activities: Recent (last 4 weeks), year to date or all time.
* Whether the module should rotate through the different periods, and the interval between rotations.
* Which activities (and the order activities) should be displayed.
* The units (miles/kilometres) used to display the total distance for each activity.

## Installation

In your terminal, go to your MagicMirror's Module folder:
````
cd ~/MagicMirror/modules
````

Clone this repository:
````
git clone https://github.com/ianperrin/MMM-Strava.git
````

Configure the module in your `config/config.js` file.

#### Updating your MMM-Strava module

If you want to update your MMM-Strava module to the latest version, use your terminal to go to your MMM-Strava module folder and type the following command:

````
git pull
```` 

If you haven't changed the modules, this should work without any problems. 
Type `git status` to see your changes, if there are any, you can reset them with `git reset --hard`. After that, git pull should be possible.

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


<table width="100%">
    <!-- why, markdown... -->
    <thead>
        <tr>
            <th>Option</th>
            <th width="100%">Description</th>
        </tr>
    <thead>
    <tbody>

        <tr>
            <td><code>strava_id</code></td>
            <td><b>Required</b> - Your Strava ID. Obtained from <a href="https://support.strava.com/hc/en-us/articles/216928797-Where-do-i-find-my-Strava-ID-">support.strava.com/hc/en-us/articles/216928797-Where-do-i-find-my-Strava-ID-</a>.</td>
        </tr>
        <tr>
            <td><code>access_token</code></td>
            <td><b>Required</b> - Your Strava API Access Token. Obtained from <a href="https://www.strava.com/settings/api">www.strava.com/settings/api</a>.</td>
        </tr>
        <tr>
            <td><code>activities</code></td>
            <td><b>Optional</b> - Determines which activities to display and in which order they are displayed.<br>
                <br><b>Possible values:</b> <code>"ride"</code>, <code>"run"</code>, <code>"swim"</code>
                <br><b>Default value:</b> <code>["ride", "run", "swim"]</code>
                <br><b>Note:</b> - The activities can be listed in any order, and only one is required. However, they must be entered as an array of strings i.e. comma separated values within square brackets.
            </td>
        </tr>
        <tr>
            <td><code>period</code></td>
            <td><b>Optional</b> - What period should be used to summarise the activities.<br>
                <br><b>Possible values:</b> <code>recent</code> = recent (last 4 weeks), <code>ytd</code> = year to date, <code>all</code> = all time
                <br><b>Default value:</b> <code>recent</code>
            </td>
        </tr>
        <tr>
            <td><code>auto_rotate</code></td>
            <td><b>Optional</b> - Whether the summary of activities should rotate through the different periods.<br>
                <br><b>Possible values:</b> <code>true</code> = rotates the summary through the different periods, <code>false</code> = displays the specified period only.
                <br><b>Default value:</b> <code>false</code>
            </td>
        </tr>
        <tr>
            <td><code>units</code></td>
            <td><b>Optional</b> - What units to use. Specified by config.js<br>
                <br><b>Possible values:</b> <code>config.units</code> = Specified by config.js, <code>metric</code> = Kilometres, <code>imperial</code> = Miles
                <br><b>Default value:</b> <code>config.units</code>
            </td>
        </tr>
        <tr>
            <td><code>fade</code></td>
            <td><b>Optional</b> - Whether to fade the activities to black. (Gradient)<br>
                <br><b>Possible values:</b> <code>true</code> or <code>false</code>
                <br><b>Default value:</b> <code>false</code>
            </td>
        </tr>
        <tr>
            <td><code>fadePoint</code></td>
            <td><b>Optional</b> - Where to start fade?<br>
                <br><b>Possible values:</b> <code>0</code> (top of the list) - <code>1</code> (bottom of list)
                <br><b>Default value:</b> <code>0.1</code>
            </td>
        </tr>
        <tr>
            <td><code>updateInterval</code></td>
            <td><b>Optional</b> - How often does the period have to change? (Milliseconds).<br>
                <br><b>Possible values:</b> <code>1000</code> - <code>86400000</code>
                <br><b>Default value:</b> <code>10000</code> (10 seconds)
            </td>
        </tr>
        <tr>
            <td><code>reloadInterval</code></td>
            <td><b>Optional</b> - How often does the data needs to be reloaded from the API? (Milliseconds). See <a href="http://strava.github.io/api/#rate-limiting">Strava documentation</a> for API rate limits<br>
                <br><b>Possible values:</b> <code>7500</code> - <code>86400000</code>
                <br><b>Default value:</b> <code>300000</code> (5 minutes)
            </td>
        </tr>
        <tr>
            <td><code>animationSpeed</code></td>
            <td><b>Optional</b> - The speed of the update animation. (Milliseconds)<br>
                <br><b>Possible values:</b><code>0</code> - <code>5000</code>
                <br><b>Default value:</b> <code>2500</code> (2.5 seconds)
            </td>
        </tr>
    </tbody>
</table>
