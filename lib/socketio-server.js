var io = require('socket.io')();
var LogGenerator = require('./log-generator.js');

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

    socket.on('start-all-workers', function() {
        debuglog('Client start all of workers');
        responseOutput(socket, logGenerator.startAll());
    });

    socket.on('stop-all-workers', function() {
        debuglog('Client stop all of workers');
        responseOutput(socket, logGenerator.stopAll());
    });

    socket.on('drop-all-workers', function() {
        debuglog('Client drop all of workers');
        responseOutput(socket, logGenerator.dropWorkers());
    });

    socket.on('init-demo', function() {
        debuglog('Client initialize the demo data');
        responseOutput(socket, logGenerator.initWorkers([
            {
                id: "demo1",
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
            },{
                id: "demo2",
                frequency: 0.5,
                template: {
                    engine: "fix",
                    message: "You can win if you want"
                },
                logtarget: {
                    file: "/tmp/demo2.log",
                },
                status: 0
            }
        ]));
    });
});

module.exports = io;
