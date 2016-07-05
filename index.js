var SERVER_PORT = 17779;

var path = require('path');
var express = require('express');

var debug = require('debug');
var debuglog = debug('logulator:agent:main');

var app = express();

app.use('/', express.static(path.join(__dirname, './public')));

var server = app.listen(SERVER_PORT, '0.0.0.0', function () {
  var host = server.address().address;
  var port = server.address().port;
  console.log('Logulator agent listening at http://%s:%s', host, port);
});

var ioserver = require('./lib/socketio-server.js');
ioserver.listen(server);
