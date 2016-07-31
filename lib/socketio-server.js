'use strict';

var io = require('socket.io')();
var semver = require('semver');
var LogGenerator = require('./log-generator.js');
var logSampleData = require('./log-sampledata.js');
var logUtil = require('./log-util.js');

var debug = require('debug');
var debuglog = debug('logulator:agent:socketio_server');

debuglog(' + Initializer logGenerator');
var logContext = {};
var logGenerator = new LogGenerator();
logGenerator.on('log-statistics', function(info) {
  if (logContext.socket) {
    logContext.socket.emit('state-worker', info);
  }
});

debuglog(' + Initialize socketio-server');

var responseOutput = function(socket, action) {
    action.then(function(result) {
        socket.emit('action-done', result);
        debuglog(' - emit action result: %s', JSON.stringify(result));
    }, function(exception) {
        socket.emit('exception', exception);
        debuglog(' - emit exception: %s', JSON.stringify(exception));
    });
}

io.on('connection', function (socket) {
    debuglog(' + Client make a connection: %s', socket.id);
    logContext.socket = socket;

    socket.on('connect-agent', function(data) {
      debuglog(' + Master make a connection to agent: %s', JSON.stringify(data));
      var info = logUtil.getPackageInfo();
      if (data && data.agent && data.agent.version) {
        debuglog(' - Master let agent check the version compatibility:');
        if (semver.satisfies(info.version, data.agent.version)) {
          debuglog(' -- valid version');
          info.status = 'pass';
        } else {
          debuglog(' -- invalid version');
          info.status = 'fail';
        }
      } else {
        debuglog(' - Master check the version compatibility by himself');
      }
      socket.emit('connect-agent-done', info);
    });

    socket.on('init-worker', function(data) {
        debuglog(' + Master initialize the worker: %s', JSON.stringify(data));
        responseOutput(socket, logGenerator.initWorker(data).then(function(result) {
            socket.emit('init-worker-done', result);
            return result;
        }));
    });

    socket.on('start-worker', function(data) {
        debuglog(' + Master start the worker: %s', JSON.stringify(data));
        responseOutput(socket, logGenerator.startWorker(data.id).then(function(result) {
            socket.emit('start-worker-done', result);
            return result;
        }));
    });

    socket.on('stop-worker', function(data) {
        debuglog(' + Master stop the worker: %s', JSON.stringify(data));
        responseOutput(socket, logGenerator.stopWorker(data.id).then(function(result) {
            socket.emit('stop-worker-done', result);
            return result;
        }));
    });

    socket.on('drop-worker', function(data) {
        debuglog(' + Master drop the worker: %s', JSON.stringify(data));
        responseOutput(socket, logGenerator.dropWorker(data.id).then(function(result) {
            socket.emit('drop-worker-done', result);
            return result;
        }));
    });

    socket.on('init-workers', function(data) {
        debuglog(' + Master initialize a list of workers');
        responseOutput(socket, logGenerator.initWorkers(data).then(function(result) {
            socket.emit('init-workers-done', result);
            return result;
        }));
    });

    socket.on('start-workers', function(data) {
        debuglog(' + Master start all of workers');
        responseOutput(socket, logGenerator.startWorkers(data.ids).then(function(result) {
            socket.emit('start-workers-done', result);
            return result;
        }));
    });

    socket.on('stop-workers', function(data) {
        debuglog(' + Master stop all of workers');
        responseOutput(socket, logGenerator.stopWorkers(data.ids).then(function(result) {
            socket.emit('stop-workers-done', result);
            return result;
        }));
    });

    socket.on('drop-workers', function(data) {
        debuglog(' + Master drop all of workers');
        responseOutput(socket, logGenerator.dropWorkers(data.ids).then(function(result) {
            socket.emit('drop-workers-done', result);
            return result;
        }));
    });

    socket.on('init-demo', function() {
        debuglog(' + Master initialize the demo data');
        responseOutput(socket, logGenerator.initWorkers(logSampleData));
    });

    socket.on('update-delaytime', function(params) {
        debuglog(' + Master change delaytime (segment & offset)');
        responseOutput(socket, logGenerator.updateDelaytime(params.id, params.delaytime).then(function(result) {
            socket.emit('update-delaytime-done', result);
            return result;
        }));
    });

    socket.on('write-message', function(params) {
        debuglog(' + Master write a log message with parameters: %s', JSON.stringify(params));
        responseOutput(socket, logGenerator.writeMessage(params.id, params.data).then(function(result) {
            socket.emit('write-message-done', result);
            return result;
        }));
    });
});

module.exports = io;
