'use strict';

var io = require('socket.io')();
var semver = require('semver');
var LogGenerator = require('./log-generator.js');
var logSampleData = require('./log-sampledata.js');
var logUtil = require('./log-util.js');

var debug = require('debug');
var debuglog = debug('logulator:agent:socketio_server');

debuglog(' + Initializer logGenerator');
var logGenerator = new LogGenerator();

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

    socket.on('connect-agent', function(data) {
      debuglog('Client make a connection to agent: %s', JSON.stringify(data));
      var info = logUtil.getPackageInfo();
      if (data && data.agent && data.agent.version) {
        if (semver.satisfies(info.version, data.agent.version)) {
          socket.emit('connect-agent-done', { status: 'pass' });
        } else {
          socket.emit('connect-agent-done', { status: 'fail' });
        }
      } else {
        socket.emit('connect-agent-done', info);
      }
    });

    socket.on('init-worker', function(data) {
        debuglog('Client initialize the worker: %s', JSON.stringify(data));
        responseOutput(socket, logGenerator.initWorker(data).then(function(result) {
            socket.emit('init-worker-done', result);
            return result;
        }));
    });

    socket.on('start-worker', function(data) {
        debuglog('Client start the worker: %s', JSON.stringify(data));
        responseOutput(socket, logGenerator.startWorker(data.id).then(function(result) {
            socket.emit('start-worker-done', result);
            return result;
        }));
    });

    socket.on('stop-worker', function(data) {
        debuglog('Client stop the worker: %s', JSON.stringify(data));
        responseOutput(socket, logGenerator.stopWorker(data.id).then(function(result) {
            socket.emit('stop-worker-done', result);
            return result;
        }));
    });

    socket.on('drop-worker', function(data) {
        debuglog('Client drop the worker: %s', JSON.stringify(data));
        responseOutput(socket, logGenerator.dropWorker(data.id).then(function(result) {
            socket.emit('drop-worker-done', result);
            return result;
        }));
    });

    socket.on('init-workers', function(data) {
        debuglog('Client initialize a list of workers');
        responseOutput(socket, logGenerator.initWorkers(data).then(function(result) {
            socket.emit('init-workers-done', result);
            return result;
        }));
    });

    socket.on('start-workers', function(data) {
        debuglog('Client start all of workers');
        responseOutput(socket, logGenerator.startWorkers(data.ids).then(function(result) {
            socket.emit('start-workers-done', result);
            return result;
        }));
    });

    socket.on('stop-workers', function(data) {
        debuglog('Client stop all of workers');
        responseOutput(socket, logGenerator.stopWorkers(data.ids).then(function(result) {
            socket.emit('stop-workers-done', result);
            return result;
        }));
    });

    socket.on('drop-workers', function(data) {
        debuglog('Client drop all of workers');
        responseOutput(socket, logGenerator.dropWorkers(data.ids).then(function(result) {
            socket.emit('drop-workers-done', result);
            return result;
        }));
    });

    socket.on('init-demo', function() {
        debuglog('Client initialize the demo data');
        responseOutput(socket, logGenerator.initWorkers(logSampleData));
    });

    socket.on('update-frequency', function(data) {
        debuglog('Client update frequency');
        responseOutput(socket, logGenerator.updateFrequency(data.id, data.frequency).then(function(result) {
            socket.emit('update-frequency-done', result);
            return result;
        }));
    });
});

module.exports = io;
