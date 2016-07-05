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

    socket.on('worker-start', function(data) {
        debuglog('Client start the worker: %s', JSON.stringify(data));
        logGenerator.start(data.workerId);
    });

    socket.on('worker-stop', function(data) {
        debuglog('Client stop the worker: %s', JSON.stringify(data));
        logGenerator.stop(data.workerId);
    });
});

module.exports = io;
