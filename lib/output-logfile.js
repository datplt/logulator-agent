'use strict';

var events = require('events');
var util = require('util');
var fs = require('fs');
var lodash = require('lodash');

var debug = require('debug');
var debuglog = debug('logulator:agent:output:logfile');
var debugVerbose = debug('logulator:agent:output:verbose');

function OutputLogfile(params) {
  debuglog(' + constructor start');
  params = params || {};

  this._fields = lodash.pick(params, ['file']);

  this.push = function(msg, callback) {
    if (lodash.isEmpty(this._fields.file)) {
      callback && callback('file not found');
      return;
    }
    fs.writeFile(this._fields.file, msg, { flag: 'a'}, function(err) {
        callback && callback(err);
    });
  }

  this.destroy = function() {

  };

  debuglog(' - constructor finish');
}

util.inherits(OutputLogfile, events.EventEmitter);

module.exports = OutputLogfile;
