'use strict';

var SERVER_HOST = process.env.LOGULATOR_AGENT_HOST || '0.0.0.0';
var SERVER_PORT = process.env.LOGULATOR_AGENT_PORT || 17779;

var path = require('path');
var express = require('express');

var debug = require('debug');
var debuglog = debug('logulator:agent:main');

var logUtil = require('./lib/log-util.js');
var info = logUtil.getPackageInfo();

var app = express();

app.use('/', function(req, res, next) {
  debuglog(' + Request root-url, display metadata');
  res.json(info);
});

var server = app.listen(SERVER_PORT, SERVER_HOST, function () {
  var host = server.address().address;
  var port = server.address().port;
  console.log('%s (%s) listening at http://%s:%s', info.name, info.version, host, port);
});

var ioserver = require('./lib/socketio-server.js');
ioserver.listen(server);
