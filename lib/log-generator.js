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
        frequency: 0.7,
        model: {
            var1: {
                type: "boolean"
            },
            var2: {
                type: "integer",
                min: 5,
                max: 1000,
            },
            var3: {
                type: "float",
                min: 0.0,
                max: 500
            },
            var4: {
                type: "string",
                min: 10,
                max: 60
            },
            var6: {
                type: "email"
            },
            var5: {
                type: "datetime"
            }
        },
        template: {
            engine: "ejs",
            message: "Message <%- var1 %>"
        },
        logfile: "/dev/null",
        status: 0
    }

    this._workers['demo2'] = {
        frequency: 0.5,
        template: {
            engine: "fix",
            message: "You can win if you want"
        },
        logfile: "/dev/null",
        status: 0
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

LogGenerator.prototype.initWorkers = function() {

}

LogGenerator.prototype.startWorker = function(id) {
    var self = this;
    var worker = self._workers[id];
    
    if (!lodash.isObject(worker)) {
        return Promise.reject({
            workerId: id,
            code: 404,
            message: "worker not found"
        });
    }
    
    if (!lodash.isEmpty(worker.handler)) {
        return Promise.reject({
            workerId: id,
            code: 404,
            message: "worker is running"
        });
    }
    
    var delayTime = Math.round(worker.frequency * 1000);
    delayTime = (delayTime > 0) ? delayTime : 1; 
    worker.handler = setInterval(function() {
        console.log(' - ... tick - %s', id);
    }, delayTime);

    return Promise.resolve({
        workerId: id,
        code: 200,
        message: "worker is started successfully"
    });
}

LogGenerator.prototype.startAll = function() {
    lodash.keys(this._workers).forEach(this.startWorker, this);
}

LogGenerator.prototype.stopWorker = function(id) {
    var self = this;
    var worker = self._workers[id];

    if (!lodash.isObject(worker)) {
        return Promise.reject({
            workerId: id,
            code: 404,
            message: "worker not found"
        });
    }
    
    if (lodash.isEmpty(worker.handler)) {
        return Promise.reject({
            workerId: id,
            code: 404,
            message: "worker is suspended"
        });
    }

    clearInterval(worker.handler);
    worker.handler = null;

    return Promise.resolve({
        workerId: id,
        code: 200,
        message: "worker is stopped successfully"
    });
}

LogGenerator.prototype.stopAll = function() {
    lodash.keys(this._workers).forEach(this.stopWorker, this);
}

LogGenerator.prototype.dropWorker = function(id) {
    
}

LogGenerator.prototype.dropWorkers = function() {
    
}
