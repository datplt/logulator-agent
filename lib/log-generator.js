'use strict';

var events = require('events');
var util = require('util');
var fs = require('fs');
var os = require('os');
var lodash = require('lodash');
var format = require('string-format');

var Promise = require('bluebird');
var Validator = require('jsonschema').Validator;
var validator = new Validator();

var debug = require('debug');
var debuglog = debug('logulator:agent:log_generator');
var debugVerbose = debug('logulator:agent:verbose');

var logRandomizer = require('./log-randomizer.js');
var LogTimer = require('./log-timer.js');

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
        self._workers[id] = self._workers[id] || {};
        var worker = self._workers[id];

        if (lodash.isObject(worker) && worker.timer && worker.timer.isRunning()) {
            return Promise.reject({
                workerId: id,
                code: 404,
                message: "worker is running"
            });
        }

        debuglog(' x transform fields: %s', JSON.stringify(lodash.keys(meta)));
        var copiedFields = [ 'delaytime', 'tick', 'template', 'logtarget' ];
        lodash.assign(worker, lodash.pick(meta, copiedFields));
        debuglog(' - transform fields: %s', JSON.stringify(copiedFields));

        debuglog(' - transform field[model]');
        worker.model = lodash.keyBy(meta.model || [], 'name');

        debuglog(' - delaytime: %s', JSON.stringify(worker.delaytime));

        if (lodash.isEmpty(worker.timer)) {
          debuglog(' - worker.timer is created');
          worker.timer = new LogTimer(
            function() {
              self.__writeLog(id, self.__randomData(id));
            },
            worker.delaytime.segment,
            worker.delaytime.offset,
            function(count) {
              self.emit('log-statistics', {
                workerId: id,
                frequency: count
              });
            }, worker.tick.duration);
        } else {
          debuglog(' - worker.timer has already existed');
          worker.timer.reset(worker.delaytime.segment, worker.delaytime.offset);
        }

        debuglog(' = worker: %s', JSON.stringify(lodash.omit(worker, ['timer'])));

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
        debuglog(" - worker[%s] always exists, don't need check", id);

        if (worker.timer.isRunning()) {
            return Promise.resolve({
                workerId: id,
                code: 200,
                message: "worker is running"
            });
        }

        worker.timer.start();

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
        if (worker.timer.isStopped()) {
            return Promise.resolve({
                workerId: id,
                code: 200,
                message: "worker has already stopped"
            });
        }

        worker.timer.stop();

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

LogGenerator.prototype.updateDelaytime = function(id, delaytime) {
    var self = this;
    return self.__retrieveWorker(id).then(function(worker) {
      var oldDelaytimeSegment = worker.delaytime.segment;
      if (delaytime && delaytime.segment) {
        worker.delaytime.segment = delaytime.segment;
      }

      var oldDelaytimeOffset = worker.delaytime.offset;
      if (delaytime && delaytime.offset) {
        worker.delaytime.offset = delaytime.offset;
      }

      worker.timer.reset(worker.delaytime.segment, worker.delaytime.offset);

      return Promise.resolve({
        workerId: id,
        code: 200,
        message: "worker has reset successfully",
        minFrequency: Math.floor(worker.tick.duration / (worker.delaytime.segment + worker.delaytime.offset)),
        maxFrequency: Math.ceil(worker.tick.duration / worker.delaytime.segment),
        old_delay_segment: oldDelaytimeSegment,
        old_delay_offset: oldDelaytimeOffset,
        new_delay_segment: worker.delaytime.segment,
        new_delay_offset: worker.delaytime.offset
      });
    });
}

LogGenerator.prototype.writeMessage = function(id, data) {
    this.__writeLog(id, data);
}

LogGenerator.prototype.__randomData = function(id) {
    var worker = this._workers[id];

    var data = {};
    var varlist = lodash.keys(worker.model);
    varlist.forEach(function(varname) {
        var varitem = worker.model[varname];
        data[varname] = logRandomizer.randomVariable(varitem);
    });

    return data;
}

LogGenerator.prototype.__buildMsg = function(id, data) {
    var self = this;
    var worker = this._workers[id];
    var msg = null;
    switch(worker.template.engine) {
        case "fix":
            msg = worker.template.message;
            break;
        case "string-format":
            var tmpl = worker.template.message;
            msg = format(tmpl, data);
            break;
        case "json":
            var tmpl = worker.template.message;
            msg = format(tmpl, {jsonobject: JSON.stringify(data)});
            break;
        default:
            msg = util.format(" - tick - %s", id);
    }

    if (!(worker.template.options && worker.template.options.hasTimestamp == false)) {
        msg = logRandomizer.getTimestamp() + ' ' + msg;
    }

    if (!(worker.template.options && worker.template.options.forceNewline == false)) {
        if (msg[msg.length-1] != os.EOL) msg += os.EOL;
    }

    return msg;
}

LogGenerator.prototype.__writeLog = function(id, data) {
    var worker = this._workers[id];
    var file = worker.logtarget.file;
    var msg = this.__buildMsg(id, data);
    fs.writeFile(file, msg, { flag: 'a'}, function(err) {
        if (err) {
            debuglog(' - error on writing log: %s', err);
        } else {
            debugVerbose(' - worker[%s] push message: %s', id, msg);
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
        "delaytime": {
            "type": "object",
            "properties": {
                "segment": {
                    "type": "float",
                    "minimum": 5,
                    "maximum": 60000
                },
                "offset": {
                    "type": "float",
                    "minimum": 0,
                    "maximum": 100
                }
            },
            "required": [ "segment" ]
        },
        "tick": {
            "type": "object",
            "properties": {
                "amount": {
                    "type": "integer",
                    "minimum": 1,
                    "maximum": 100
                },
                "duration": {
                    "type": "integer",
                    "minimum": 1000,
                    "maximum": 60000
                }
            },
            "required": [ "duration" ]
        },
        "model": {
            "type": "array",
            "items": {
                "oneOf": [
                    {
                        "id": "https://logbeat.com/logulator/schema-types/boolean",
                        "type": "object",
                        "properties": {
                            "name": {
                                "type": "string",
                            },
                            "type": {
                                "type": "string",
                                "enum": ["boolean"]
                            }
                        },
                        "required": [ "name", "type" ]
                    },
                    {
                        "id": "https://logbeat.com/logulator/schema-types/string",
                        "type": "object",
                        "properties": {
                            "name": {
                                "type": "string",
                            },
                            "type": {
                                "type": "string",
                                "enum": ["string"]
                            },
                            "minLength": {
                                "type": "integer"
                            },
                            "maxLength": {
                                "type": "integer"
                            }
                        },
                        "required": [ "name", "type" ]
                    },
                    {
                        "id": "https://logbeat.com/logulator/schema-types/datetime",
                        "type": "object",
                        "properties": {
                            "name": {
                                "type": "string",
                            },
                            "type": {
                                "type": "string",
                                "enum": ["datetime"]
                            }
                        },
                        "required": [ "name", "type" ]
                    },
                    {
                        "id": "https://logbeat.com/logulator/schema-types/integer",
                        "type": "object",
                        "properties": {
                            "name": {
                                "type": "string",
                            },
                            "type": {
                                "type": "string",
                                "enum": ["integer"]
                            },
                            "min": {
                                "type": "integer"
                            },
                            "max": {
                                "type": "integer"
                            }
                        },
                        "required": [ "name", "type" ]
                    },
                    {
                        "id": "https://logbeat.com/logulator/schema-types/float",
                        "type": "object",
                        "properties": {
                            "name": {
                                "type": "string",
                            },
                            "type": {
                                "type": "string",
                                "enum": ["float"]
                            },
                            "min": {
                                "type": "float"
                            },
                            "max": {
                                "type": "float"
                            }
                        },
                        "required": [ "name", "type" ]
                    },
                    {
                        "id": "https://logbeat.com/logulator/schema-types/choice",
                        "type": "object",
                        "properties": {
                            "name": {
                                "type": "string",
                            },
                            "type": {
                                "type": "string",
                                "enum": ["choice"]
                            },
                            "list": {
                                "type": "array",
                                "items": {
                                    "type": "string"
                                },
                                "minItems": 1,
                                "uniqueItems": true
                            }
                        },
                        "required": [ "name", "type", "list" ]
                    }
                ]
            }
        },
        "template": {
            "type": "object",
            "properties": {
                "engine": {
                    "type": "string"
                },
                "message": {
                    "type": "string"
                }
            },
            "required": [ "message" ]
        },
        "logtarget": {
            "type": "object",
            "properties": {
                "file": {
                    "type": "string"
                }
            },
            "required": [ "file" ]
        }
    },
    "required": [ "id", "delaytime", "tick", "template", "logtarget" ]
}
