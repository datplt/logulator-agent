'use strict';

var events = require('events');
var util = require('util');

var debug = require('debug');
var debuglog = debug('logulator:agent:output:restapi');

function OutputRestapi(params) {
  var self = this;
  debuglog(' + constructor start');
  params = params || {};

  this._fields = lodash.pick(params, ['host']);

  this.push = function(msg, callback) {

  }

  this.destroy = function() {
  };

  debuglog(' - constructor end');
}

util.inherits(OutputRestapi, events.EventEmitter);

module.exports = OutputRestapi;
