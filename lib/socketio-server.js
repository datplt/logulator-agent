'use strict';

var io = require('socket.io')();
var LogGenerator = require('./log-generator.js');
var logSampleData = require('./log-sampledata.js');

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

    socket.on('log-generator-state', function(data) {
        debuglog('Client request the logGenerator info: %s', JSON.stringify(data));
        socket.emit('log-generator-state-res', {
            cols: 1,
            rows: 2
        });
    });

    socket.on('init-worker', function(data) {
        debuglog('Client initialize the worker: %s', JSON.stringify(data));
        responseOutput(socket, logGenerator.initWorker(data));
    });

    socket.on('start-worker', function(data) {
        debuglog('Client start the worker: %s', JSON.stringify(data));
        responseOutput(socket, logGenerator.startWorker(data.id));
    });

    socket.on('stop-worker', function(data) {
        debuglog('Client stop the worker: %s', JSON.stringify(data));
        responseOutput(socket, logGenerator.stopWorker(data.id));
    });

    socket.on('drop-worker', function(data) {
        debuglog('Client drop the worker: %s', JSON.stringify(data));
        responseOutput(socket, logGenerator.dropWorker(data.id));
    });

    socket.on('init-workers', function(data) {
        debuglog('Client initialize a list of workers');
        responseOutput(socket, logGenerator.initWorkers(data));
    });

    socket.on('start-workers', function(data) {
        debuglog('Client start all of workers');
        responseOutput(socket, logGenerator.startWorkers(data.ids));
    });

    socket.on('stop-workers', function(data) {
        debuglog('Client stop all of workers');
        responseOutput(socket, logGenerator.stopWorkers(data.ids));
    });

    socket.on('drop-workers', function(data) {
        debuglog('Client drop all of workers');
        responseOutput(socket, logGenerator.dropWorkers(data.ids));
    });

    socket.on('init-demo', function() {
        debuglog('Client initialize the demo data');
        responseOutput(socket, logGenerator.initWorkers(logSampleData));
    });
});

module.exports = io;
