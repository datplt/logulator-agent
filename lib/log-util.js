'use strict';

var fs = require('fs');
var lodash = require('lodash');

var meta = JSON.parse(fs.readFileSync(__dirname + '/../package.json', 'utf8'));

var obj = {}

obj.getPackageInfo = function() {
  return lodash.pick(meta, ['name', 'version', 'author']);
};

module.exports = obj;
