var io = require('socket.io')();
var LogGenerator = require('./log-generator.js');

var debug = require('debug');
var debuglog = debug('logulator:agent:socketio_server');

debuglog(' + Initializer logGenerator');
var logGenerator = new LogGenerator();

debuglog(' + Initialize socketio-server');

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
        logGenerator.initWorker(data.workerId, data).then(function(result) {
            socket.emit('action-done', result);
        }, function(exception) {
            socket.emit('exception', exception);
        });
    });

    socket.on('start-worker', function(data) {
        debuglog('Client start the worker: %s', JSON.stringify(data));
        logGenerator.startWorker(data.id);
    });

    socket.on('stop-worker', function(data) {
        debuglog('Client stop the worker: %s', JSON.stringify(data));
        logGenerator.stopWorker(data.id);
    });

    socket.on('start-all-workers', function() {
        debuglog('Client start all of workers');
        logGenerator.startAll();
    });

    socket.on('stop-all-workers', function() {
        debuglog('Client stop all of workers');
        logGenerator.stopAll();
    });
});

module.exports = io;
