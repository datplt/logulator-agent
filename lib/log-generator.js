'use strict';

var events = require('events');
var util = require('util');
var fs = require('fs');
var lodash = require('lodash');

var Promise = require('bluebird');
var Validator = require('jsonschema').Validator;
var validator = new Validator();

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
        logtarget: {
            file: "/var/log/demo/demo1.log",
        },
        status: 0
    }

    this._workers['demo2'] = {
        frequency: 0.5,
        template: {
            engine: "fix",
            message: "You can win if you want"
        },
        logtarget: {
            file: "/dev/null",
        },
        status: 0
    }
}

util.inherits(LogGenerator, events.EventEmitter);

module.exports = LogGenerator;

LogGenerator.prototype.initWorker = function(metainf) {
    var self = this;

    return self.validateWorker(metainf).then(function(meta) {
        var id = meta.id;
        var worker = self._workers[id];

        if (lodash.isObject(worker) && worker.handler) {
            return Promise.reject({
                workerId: id,
                code: 404,
                message: "worker is running"
            });
        }

        self._workers[id] = self._workers[id] || {};

        lodash.assign(self._workers[id], lodash.omit(meta, ['id']));

        return Promise.resolve({
            workerId: id,
            code: 200,
            message: "worker has been initialized successfully"
        });
    })
}

LogGenerator.prototype.initWorkers = function(metainfs) {
    var self = this;
    var workerIds = lodash.keys(this._workers);
    return Promise.map(metainfs, function(metainf) {
        return self.initWorker(metainf).then(function(result) {
            return result;
        }, function(exception) {
            return exception;
        });
    });
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
        return Promise.resolve({
            workerId: id,
            code: 200,
            message: "worker is running"
        });
    }
    
    var delayTime = Math.round(worker.frequency * 1000);
    delayTime = (delayTime > 0) ? delayTime : 1; 

    debuglog(" - worker[%s] always exists, don't need check");
    
    worker.handler = setInterval(function() {
        self.__writeLog(id);
    }, delayTime);

    return Promise.resolve({
        workerId: id,
        code: 200,
        message: "worker is started successfully"
    });
}

LogGenerator.prototype.startAll = function() {
    var self = this;
    var workerIds = lodash.keys(this._workers);
    return Promise.map(workerIds, function(id) {
        return self.startWorker(id).then(function(result) {
            return result;
        }, function(exception) {
            return exception;
        });
    });
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
        return Promise.resolve({
            workerId: id,
            code: 200,
            message: "worker has already stopped"
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
    var self = this;
    var workerIds = lodash.keys(self._workers);
    return Promise.map(workerIds, function(id) {
        return self.stopWorker(id).then(function(result) {
            return result;
        }, function(exception) {
            return exception;
        });
    });
}

LogGenerator.prototype.dropWorker = function(id) {
    var self = this;
    return self.stopWorker(id).then(function() {
        delete self._workers[id];
        return Promise.resolve({
            workerId: id,
            code: 200,
            message: "worker is dropped successfully"
        });
    })
}

LogGenerator.prototype.dropWorkers = function() {
    var self = this;
    var workerIds = lodash.keys(self._workers);
    return Promise.map(workerIds, function(id) {
        return self.dropWorker(id).then(function(result) {
            return result;
        }, function(exception) {
            return exception;
        });
    });
}

LogGenerator.prototype.__writeLog = function(id) {
    var worker = this._workers[id];
    var msg = util.format(" - ... tick - %s\n", id);
    fs.writeFile(worker.logtarget.file, msg, { flag: 'a'}, function(err) {
        if (err) {
            debuglog(' - error on writing log: %s', err);
        }
    })
}

LogGenerator.prototype.validateWorker = function(workerItem) {
    var result = validator.validate(workerItem, workerItemSchema);
    if (result.errors.length > 0) {
        debuglog(' - validateWorker raise error: %s', JSON.stringify(result));
        return Promise.reject({
            code: 404,
            message: 'Worker argument validation is failed' 
        });
    }
    return Promise.resolve(metadata);
}

var workerItemSchema = {
    "id": "worker",
    "type": "object",
    "properties": {
        "id": {
            "type": "string"
        },
        "frequency": {
            "type": "float"
        },
        "model": {
            "type": "object"
        },
        "template": {
            "type": "object"
        },
        "logtarget": {
            "type": "object"
        }
    }
}
