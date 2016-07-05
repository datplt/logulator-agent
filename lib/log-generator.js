'use strict';

var events = require('events');
var util = require('util');
var lodash = require('lodash');

var Promise = require('bluebird');

var debug = require('debug');
var debuglog = debug('logulator:agent:log_generator');

function LogGenerator(params) {
    params = params || {};

    this._workers = {};

    this._workers['demo1'] = {
        frequency: 0.7
    }

    this._workers['demo2'] = {
        frequency: 0.5
    }
}

util.inherits(LogGenerator, events.EventEmitter);

module.exports = LogGenerator;

LogGenerator.prototype.initWorker = function(id, config) {
    var self = this;
    var worker = self._workers[id];
    if (worker && worker.handler) {
        return Promise.reject({
            workerId: id,
            code: 404,
            message: "worker is running"
        });
    }

    self._workers[id] = self._workers[id] || {};

    lodash.assign(self._workers[id], config);

    return Promise.resolve({
        workerId: id,
        code: 200,
        message: "worker has been initialized successfully"
    });
}

LogGenerator.prototype.startWorker = function(id) {
    var self = this;
    var worker = self._workers[id];
    if (worker && !worker.handler) {
        var delayTime = Math.round(worker.frequency * 1000);
        delayTime = (delayTime > 0) ? delayTime : 1; 
        worker.handler = setInterval(function() {
            console.log(' - ... tick - %s', id);
        }, delayTime);
    }
}

LogGenerator.prototype.startAll = function() {
    lodash.keys(this._workers).forEach(this.startWorker, this);
}

LogGenerator.prototype.stopWorker = function(id) {
    var self = this;
    var worker = self._workers[id];
    if (worker && worker.handler) {
        clearInterval(worker.handler);
        worker.handler = null;
    }
}

LogGenerator.prototype.stopAll = function() {
    lodash.keys(this._workers).forEach(this.stopWorker, this);
}