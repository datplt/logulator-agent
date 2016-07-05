'use strict';

var events = require('events');
var util = require('util');
var lodash = require('lodash');

var debug = require('debug');
var debuglog = debug('logulator:agent:log_generator');

function LogGenerator(params) {
    params = params || {};

    this._workers = {};

    this._workers['demo'] = {
        frequency: 0.005
    }
}

util.inherits(LogGenerator, events.EventEmitter);

module.exports = LogGenerator;

LogGenerator.prototype.start = function(workerId) {
    var self = this;
    var worker = self._workers[workerId];
    if (worker) {
        var delayTime = Math.round(worker.frequency * 1000);
        delayTime = (delayTime > 0) ? delayTime : 1; 
        worker.handler = setInterval(function() {
            console.log(' - ... tick');
        }, delayTime);
    }
}

LogGenerator.prototype.stop = function(workerId) {
    var self = this;
    var worker = self._workers[workerId];
    if (worker) {
        if (worker.handler) {
            clearInterval(worker.handler);
        }
    }
}