var util = {};

util.getTimestamp = function() {
  return (new Date()).toISOString();
};

module.exports = util;
