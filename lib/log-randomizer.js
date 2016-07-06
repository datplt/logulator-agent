'use strict';

var lodash = require('lodash');

var util = {};

util.getTimestamp = function() {
  return (new Date()).toISOString();
};

util.randomVariable = function(pattern) {
    var value = null;
    switch(pattern.type) {
        case "boolean":
            value = (lodash.random(0,1) == 1);
            break;
        case "integer":
            value = lodash.random(
                pattern.min || Number.MIN_SAFE_INTEGER,
                pattern.max || Number.MAX_SAFE_INTEGER,
                false);
            break;
        case "float":
            value = lodash.random(
                pattern.min || Number.MIN_VALUE,
                pattern.max || Number.MAX_VALUE,
                true);
            break;
        case "choice":
            var pos = lodash.random(0, pattern.list.length - 1);
            value = pattern.list[pos];
            break;
        default:
            value = null;
    }
    return value;
};

module.exports = util;
