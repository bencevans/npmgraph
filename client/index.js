
var async = require('async');
var $ = require('jquery-browserify')
var _ = require('underscore');

var NS = "http://www.w3.org/2000/svg";
function chart(svgDOM, data) {
  var width = 710;
  var height = 150;
  var barGutter = 1;
  var barWidth = width / data.length
  var max = null;
  for(var i in data) {
    if(max == null || max < data[i].downloads)
      max = data[i].downloads;
  }
  for(var i in data) {
    var SVGObj=document.createElementNS(NS,"rect");
    SVGObj.setAttribute("height", ((data[i].downloads == 0) ? 0 : Math.round((data[i].downloads/max) * height)));
    SVGObj.setAttribute("width", barWidth - barGutter);
    SVGObj.setAttribute("y", height - ((data[i].downloads == 0) ? 0 : Math.round((data[i].downloads/max) * height)));
    SVGObj.setAttribute("x", i * barWidth);
    var title = document.createElementNS(NS, "title");
    title.textContent = data[i].date + ': ' + data[i].downloads;
    SVGObj.appendChild(title);
    svgDOM.appendChild(SVGObj);
  }
};

var pageType = $('html').attr('data-page');

if(pageType == 'user') {
  var user = $('html').attr('data-user')
  $.getJSON('/user/' + user + '/packages.json', function(packages) {
    async.map(packages, function(package, cb) {
      $.getJSON('/package/' + package.name + '/30days.json', function(downloads) {
        package.downloads = downloads;
        package.totalDownloads = _.reduce(downloads, function(memo, day) { return memo + day.downloads; }, 0);
        $('#package-list').append('<tr><td><a href="/package/' + package.name + '">' + package.name + '</a></td><td>' + package.description + '</td><td>' + package.totalDownloads + '</td></tr>');
        cb(null, package);
      });
    }, function(err, packages) {
      var dayTotals = [];
      for (var i = 0; i <= 29; i++) {
        dayTotals[i] = _.reduce(packages, function(memo, package) { return memo + package.downloads[i].downloads; }, 0);
      };
      var maxDownloadsPerDay = _.max(dayTotals);
      console.log(maxDownloadsPerDay)
      console.log(dayTotals);
      console.log(err, packages);
      chart(document.querySelector('svg'), dayTotals);
    });
  });
}