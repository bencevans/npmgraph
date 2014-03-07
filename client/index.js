
'use strict';

/**
 * Dependencies
 */

var async = require('async');
var $     = require('jquery-browserify');
var _     = require('underscore');

/**
 * Helpers
 */

/**
 * Reports error to user. TODO: Report to devleoper
 * @param  {Error} error
 * @return {Void}
 */
function errorReporter(error) {
  window.alert('ERROR. Sorry, try reloading the page.');
  if(console && console.error) {
    console.error(error);
  }
}

/**
 * Draw a bar chart
 * @param  {DOM SVG Object} svgDOM
 * @param  {Array} data
 * @return {Void}
 */
function chart(svgDOM, data) {
  var NS = 'http://www.w3.org/2000/svg';
  var width = 710;
  var height = 150;
  var barGutter = 1;
  var barWidth = width / data.length;
  var max = null;
  var i;
  for(i in data) {
    if(max === null || max < data[i].downloads) {
      max = data[i].downloads;
    }
  }
  for(i in data) {
    var SVGObj=document.createElementNS(NS,'rect');
    SVGObj.setAttribute('height', ((data[i].downloads === 0) ? 0 : Math.round((data[i].downloads/max) * height)));
    SVGObj.setAttribute('width', barWidth - barGutter);
    SVGObj.setAttribute('y', height - ((data[i].downloads === 0) ? 0 : Math.round((data[i].downloads/max) * height)));
    SVGObj.setAttribute('x', i * barWidth);
    var title = document.createElementNS(NS, 'title');
    title.textContent = data[i].day + ': ' + data[i].downloads;
    SVGObj.appendChild(title);
    svgDOM.appendChild(SVGObj);
  }
}

/**
 * Converts input to user or package URL
 * @param  {String} input
 * @return {String}       URL to redirect to.
 */
function getURL(input) {
    var matchResult;

    input = input.trim();

    // User
    matchResult = input.match(/^https?:\/\/npmjs.org\/~(.+)$/);
    if(matchResult) {
      return '/~' + matchResult[1];
    }

    // Package
    matchResult = input.match(/^https:\/\/npmjs.org\/package\/(.+)/);
    if(matchResult) {
      return '/package/' + matchResult[1];
    }

    matchResult = input.match(/^[@|~](.+)/);
    if(matchResult) {
      return '/~' + matchResult[1];
    }

    matchResult = input.match(/^(.+)/);
    if(matchResult) {
      return '/package/' + matchResult[1];
    }

    return false;

  }

/**
 * Routes
 */

var pageType = $('html').attr('data-page');

if(pageType === 'user') {
  var user = $('html').attr('data-user');
  $('.loader').css('display', 'block');
  $.getJSON('/user/' + user + '/packages.json', function(packages) {
    async.map(packages, function(packageInfo, cb) {
      $.getJSON('/package/' + packageInfo.name + '/30days.json', function(downloads) {
        packageInfo.downloads = downloads;
        packageInfo.totalDownloads = _.reduce(downloads, function(memo, day) { return memo + day.downloads; }, 0);
        $('#package-list').append('<tr><td><a href="/package/' + packageInfo.name + '">' + packageInfo.name + '</a></td><td>' + packageInfo.description + '</td><td>' + packageInfo.totalDownloads + '</td></tr>');
        cb(null, packageInfo);
      });
    }, function(err, packages) {
      if(err) {
        return errorReporter(err);
      }
      if(packages && packages.length > 0) {
        var dayTotals = [];
        var tempFunc = function(memo, packageInfo) { return memo + packageInfo.downloads[i].downloads; };
        for (var i = 0; i <= 29; i++) {
          dayTotals[i] = {
            downloads: _.reduce(packages, tempFunc, 0),
            date: packages[0].downloads[i].date
          };
        }
        chart(document.querySelector('svg'), dayTotals);
      } else {
        window.alert('This user either doesn\'t exist or hasn\'t released any modules');
      }
      $('.loader').css('display', 'none');
    });
  });
} else if (pageType === 'package') {
  var packageInfo = $('html').attr('data-package');
  $('.loader').css('display', 'block');
  $.getJSON('/package/' + packageInfo + '/30days.json', function(data) {
    chart(document.querySelector('svg'), data.downloads);
    $('.loader').css('display', 'none');
  });
} else if(pageType === 'search') {
  var form = document.getElementById('form');
  var urlplacer = document.getElementById('urlplacer');

  form.onsubmit = function() {
    window.location.href = getURL(urlplacer.value);
    return false;
  };

}
