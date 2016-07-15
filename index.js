var SERVER_PORT = 17779;

var path = require('path');
var fs = require('fs');
var express = require('express');

var debug = require('debug');
var debuglog = debug('logulator:agent:main');

var meta = JSON.parse(fs.readFileSync('package.json', 'utf8'));

var app = express();

app.use('/', function(req, res, next) {
  debuglog(' + Request root-url, display metadata');
  res.json({
    name: meta.name,
    version: meta.version,
    author: meta.author
  });
});

var server = app.listen(SERVER_PORT, '0.0.0.0', function () {
  var host = server.address().address;
  var port = server.address().port;
  console.log('Logulator agent listening at http://%s:%s', host, port);
});

var ioserver = require('./lib/socketio-server.js');
ioserver.listen(server);
