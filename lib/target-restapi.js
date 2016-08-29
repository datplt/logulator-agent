'use strict';

var events = require('events');
var util = require('util');
var lodash = require('lodash');
var Promise = require('bluebird');
var superagent = require('superagent');

var debug = require('debug');
var debuglog = debug('logulator:agent:target:restapi');

function TargetRestapi(params) {
  var self = this;
  debuglog(' + constructor start');
  params = params || {};

  this._fields = lodash.pick(params, ['host']);

  this.push = function(data, callback) {
    debuglog(' - push data [%s] to restapi: [%s]', JSON.stringify(data), self._fields.host);
    superagent
    .post(self._fields.host)
    .type('application/json')
    .accept('application/json')
    .send(data)
    .end(function(err, res) {
      if (err) {
        debuglog(' - error: %s', err);
      } else {
        debuglog(' - result: %s', JSON.stringify(res.body));
      }
      callback && callback(err, res);
    });
  };

  this.destroy = function() {
    debuglog(' - targetRestapi[%s] has been destroyed', this._fields.host);
    return Promise.resolve({});
  };

  debuglog(' - constructor end');
}

util.inherits(TargetRestapi, events.EventEmitter);

module.exports = TargetRestapi;
