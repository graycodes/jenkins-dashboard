var blessed = require('blessed');
var contrib = require('blessed-contrib');
var _ = require('lodash');
var moment = require('moment');
var colors = require('colors/safe');
var jenkinsUrl = process.env.JENKINS_URL;
if (!jenkinsUrl) {
    throw new Error('JENKINS_URL not set');
}
var jenkins = require('jenkins')(jenkinsUrl);
var jobsFilterRegex = new RegExp(process.env.JOBS_FILTER, 'i');
var screen = blessed.screen();
var grid = new contrib.grid({rows: 14, cols: 12, screen: screen});
var cols = 3;

function filterJobs(jobs) {
    return _.filter(jobs, function (job) {
        return job.name.match(jobsFilterRegex);
    });
};

function getJobColor(job) {
    if (black && /_anime/.test(job.color)) {
	return colors.black(job.name);
    }

    var jobColor = job.color.replace('_anime', '');
    var colorMap = {
        aborted: 'orange',
        blue: 'green',
        disabled: 'gray',
        grey: 'gray',
        notbuilt: 'gray',
        red: 'red',
        yellow: 'yellow'
    };
    var color = colorMap.hasOwnProperty(jobColor) ? colorMap[jobColor] : 'yellow';
    if (colors[color]) {
	return colors[color](job.name);
    } else {
	return job.name;
    }
}

function getJenkinsStatus(err, callback) {
    if (err) {
        return callback(err, null, getJenkinsStatus);
    }

    jenkins.info(function (error, data) {
        if (error) {
            return callback(error, null, getJenkinsStatus);
        }
        return callback(null, _.sortBy(filterJobs(data.jobs), 'name'), getJenkinsStatus);
    });
};
var black = false;
function showJobs(err, res, cb) {
    var table = contrib.table({
        keys: false,
        fg: 'white',
        interactive: false,
        width: '100%',
        height: '100%',
        columnWidth: _.fill(_.range(cols), 28)
    });

    screen.append(table);

    var jobs = _.map(res, getJobColor);

    table.setData({
        headers: [moment().format('YYYY-MM-DD HH:mm:ss')],
        data: _.chunk(jobs, cols),
    });

    screen.key(['escape', 'q', 'C-c'], function(ch, key) {
      return process.exit(0);
    });

    screen.render()

    black = !black;

    setTimeout(function () {
        return cb(null, showJobs);
    }, 1000);

}

getJenkinsStatus(null, showJobs);
