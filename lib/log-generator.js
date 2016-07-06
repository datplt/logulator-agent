'use strict';

var events = require('events');
var util = require('util');
var fs = require('fs');
var os = require('os');
var lodash = require('lodash');
var format = require('string-format');
var ejs = require('ejs');

var Promise = require('bluebird');
var Validator = require('jsonschema').Validator;
var validator = new Validator();

var debug = require('debug');
var debuglog = debug('logulator:agent:log_generator');

var logRandomizer = require('./log-randomizer.js');

function LogGenerator(params) {
    params = params || {};
    this._workers = {};
}

util.inherits(LogGenerator, events.EventEmitter);

module.exports = LogGenerator;

LogGenerator.prototype.initWorker = function(metainf) {
    var self = this;

    return self.__validateWorker(metainf).then(function(meta) {
        debuglog(' - worker[%s] is validated', JSON.stringify(meta));
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

        debuglog(' x transform fields: %s', JSON.stringify(lodash.keys(meta)));

        var copiedFields = [ 'frequency', 'template', 'logtarget' ];
        lodash.assign(self._workers[id], lodash.pick(meta, copiedFields));
        debuglog(' - transform fields: ', JSON.stringify(copiedFields));

        debuglog(' - transform field[model]');
        self._workers[id].model = lodash.keyBy(meta.model || [], 'name');

        debuglog(' = worker descriptor: %s', JSON.stringify(self._workers[id]));

        return Promise.resolve({
            workerId: id,
            code: 200,
            message: "worker has been initialized successfully"
        });
    })
}

LogGenerator.prototype.initWorkers = function(metainfs) {
    var self = this;
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
    return self.__retrieveWorker(id).then(function(worker) {
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
    });
}

LogGenerator.prototype.startWorkers = function(ids) {
    var self = this;
    var workerIds = lodash.isArray(ids) ? ids : lodash.keys(self._workers);
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
    return self.__retrieveWorker(id).then(function(worker) {
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
    });
}

LogGenerator.prototype.stopWorkers = function(ids) {
    var self = this;
    var workerIds = lodash.isArray(ids) ? ids : lodash.keys(self._workers);
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

LogGenerator.prototype.dropWorkers = function(ids) {
    var self = this;
    var workerIds = lodash.isArray(ids) ? ids : lodash.keys(self._workers);
    return Promise.map(workerIds, function(id) {
        return self.dropWorker(id).then(function(result) {
            return result;
        }, function(exception) {
            return exception;
        });
    });
}

LogGenerator.prototype.__randomData = function(id) {
    var self = this;
    var worker = this._workers[id];

    var data = {};
    var varlist = lodash.keys(worker.model);
    varlist.forEach(function(varname) {
        var varitem = worker.model[varname];
        switch(varitem.type) {
            case "boolean":
                data[varname] = (lodash.random(0,1) == 1);
                break;
            case "integer":
                data[varname] = lodash.random(
                    varitem.min || Number.MIN_SAFE_INTEGER,
                    varitem.max || Number.MAX_SAFE_INTEGER,
                    false);
                break;
            case "float":
                data[varname] = lodash.random(
                    varitem.min || Number.MIN_VALUE,
                    varitem.max || Number.MAX_VALUE,
                    true);
                break;
            case "choice":
                var pos = lodash.random(0, varitem.list.length - 1);
                data[varname] = varitem.list[pos];
                break;
            default:
                data[varname] = null;
        }
    });

    debuglog(' - randomized data: %s', JSON.stringify(data));

    return data;
}

LogGenerator.prototype.__buildMsg = function(id) {
    var self = this;
    var worker = this._workers[id];
    var msg = null;
    switch(worker.template.engine) {
        case "fix":
            msg = worker.template.message;
            break;
        case "string-format":
            var tmpl = worker.template.message;
            var data = self.__randomData(id);
            msg = format(tmpl, data);
            break;
        case "ejs":
        case "json":
            var tmpl = worker.template.message;
            var data = self.__randomData(id);
            msg = format(tmpl, {jsonobject: JSON.stringify(data)});
            break;
        default:
            msg = util.format(" - tick - %s", id);
    }

    if (!(worker.template.options && worker.template.options.hasTimestamp == false)) {
        msg = logRandomizer.getTimestamp() + ' ' + msg;
    }

    if (msg[msg.length-1] != os.EOL) msg += os.EOL;

    return msg;
}

LogGenerator.prototype.__writeLog = function(id) {
    var worker = this._workers[id];
    var file = worker.logtarget.file;
    var msg = this.__buildMsg(id);
    fs.writeFile(file, msg, { flag: 'a'}, function(err) {
        if (err) {
            debuglog(' - error on writing log: %s', err);
        }
    })
}

LogGenerator.prototype.__retrieveWorker = function(id) {
    var self = this;
    var worker = self._workers[id];

    if (!lodash.isObject(worker)) {
        return Promise.reject({
            workerId: id,
            code: 404,
            message: "worker not found"
        });
    }

    return Promise.resolve(worker);
}

LogGenerator.prototype.__validateWorker = function(workerItem) {
    var result = validator.validate(workerItem, workerItemSchema);
    if (result.errors.length > 0) {
        debuglog(' - validateWorker raise error: %s', JSON.stringify(result));
        return Promise.reject({
            code: 404,
            message: 'Worker argument validation is failed'
        });
    }
    return Promise.resolve(workerItem);
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
            "type": "array"
        },
        "template": {
            "type": "object"
        },
        "logtarget": {
            "type": "object"
        }
    }
}
