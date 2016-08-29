'use strict';

var events = require('events');
var util = require('util');
var fs = require('fs');
var os = require('os');
var lodash = require('lodash');
var format = require('string-format');
var Promise = require('bluebird');
var debug = require('debug');
var debuglog = debug('logulator:agent:output:logfile');

function OutputLogfile(params) {
  var self = this;
  debuglog(' + constructor start');
  params = params || {};

  this._fields = lodash.pick(params, ['file', 'template']);

  var getTimestamp = function() {
    return (new Date()).toISOString();
  };

  var stringify = function(data) {
    var msg = null;
    switch(self._fields.template.engine) {
        case "fix":
            msg = self._fields.template.message;
            break;
        case "string-format":
            var tmpl = self._fields.template.message;
            msg = format(tmpl, data);
            break;
        case "json":
            var tmpl = self._fields.template.message;
            msg = format(tmpl, {jsonobject: JSON.stringify(data)});
            break;
        default:
            msg = util.format(" - tick - %s", id);
    }

    if (!(self._fields.template.options && self._fields.template.options.hasTimestamp == false)) {
        msg = getTimestamp() + ' ' + msg;
    }

    if (!(self._fields.template.options && self._fields.template.options.forceNewline == false)) {
        if (msg[msg.length-1] != os.EOL) msg += os.EOL;
    }

    return msg;
  }

  this.push = function(data, callback) {
    if (lodash.isEmpty(this._fields.file)) {
      callback && callback('file not found');
      return;
    }
    if (lodash.isEmpty(this._fields.template)) {
      callback && callback('template not found');
      return;
    }

    if (!lodash.isString(data)) {
      data = stringify(data);
    }

    fs.writeFile(this._fields.file, data, { flag: 'a'}, function(err) {
      callback && callback(err);
    });
  }

  this.destroy = function() {
    debuglog(' - targetLogfile[%s] has been destroyed', this._fields.file);
    return Promise.resolve({});
  };

  debuglog(' - constructor end');
}

util.inherits(OutputLogfile, events.EventEmitter);

module.exports = OutputLogfile;
