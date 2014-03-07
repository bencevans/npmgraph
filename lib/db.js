
'use strict';

/**
 * Dependencies
 */

var RegClient = require('npm-registry-client');
var request   = require('request');
var _         = require('underscore');

var Client;
module.exports = Client = function(cachey, ttl) {
  this.cachey = cachey;
  this.ttl = ttl || 20 * 1000;
  return this;
};

Client.prototype.get30Days = function(packageName, cb) {

  this.cachey.cache('package:' + packageName + ':30days', this.ttl, function(cb) {
    request({
      uri: 'https://api.npmjs.org/downloads/range/last-month/' + packageName
    }, function(err, res, data) {
      cb(err, data);
    });
  }, function(err, body) {
    if(err) { return cb(err); }

    var data;

    try {
      data = JSON.parse(body);
    } catch (err) {
      return cb(err);
    }

    data.totalDownloads = 0;

    _.each(data.downloads, function(day) {
      data.totalDownloads = data.totalDownloads + day.downloads;
    });


    cb(null, data);

  });

};

Client.prototype.get7Days = function(packageName, cb) {
  this.cachey.cache('package:' + packageName + ':7days', this.ttl, function(cb) {
    request({
      uri: 'https://api.npmjs.org/downloads/range/last-week/' + packageName
    }, function(err, res, data) {
      cb(err, data);
    });
  }, function(err, body) {
    if(err) { return cb(err); }

    var data;

    try {
      data = JSON.parse(body);
    } catch (err) {
      return cb(err);
    }

    data.totalDownloads = 0;

    _.each(data.downloads, function(day) {
      data.totalDownloads = data.totalDownloads + day.downloads;
    });


    cb(null, data);

  });
};

Client.prototype.getPackagesByUser = function(name, cb) {
  var regClient = new RegClient({registry:'http://registry.npmjs.org/', cache:'./'});
  regClient.get('/-/_view/browseAuthors?group_level=3&startkey=%5B%22' + name + '%22%5D&endkey=%5B%22' + name +'%22%2C%7B%7D%5D&skip=0&limit=1000', 0, function(err, body) {
    if(err) {
      return cb(err);
    }
    cb(null, _.map(body.rows, function(item) {
      return {
        name: item.key[1],
        description: item.key[2]
      };
    }));
  });
};

Client.prototype.getPackages = function(cb) {
  this.cachey.cache('packages', 60 * 60, function(cb) {
    console.log('requesting new packages');
    request({
      uri: 'http://registry.npmjs.org/-/short/',
      json: true
    }, function(err, res, body) {
      console.log('returnomg mewly quited');
      cb(err, body);
    });
  }, function(err, body) {
    cb(err, body);
  });
};