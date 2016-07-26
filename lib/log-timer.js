'use strict';

var MIN_SEGMENT = 10;
var MIN_OFFSET = 0;

function standardizeInt(min, number) {
  return (number > min) ? number : min;
}

function getRandomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function Timer(fn, segment, offset, activated) {
    var timeSegment = standardizeInt(MIN_SEGMENT, segment);
    var timeOffset = standardizeInt(MIN_OFFSET, offset);
    var taskHandler = null;

    this.start = function() {
        if (!taskHandler) {
            var taskFunction = fn;
            if (timeOffset > 0) {
              taskFunction = function() {
                setTimeout(fn, getRandomInt(0, timeOffset));
              };
            }
            taskHandler = setInterval(taskFunction, timeSegment);
        }
        return this;
    }

    this.stop = function() {
        if (taskHandler) {
            clearInterval(taskHandler);
            taskHandler = null;
        }
        return this;
    }

    this.reset = function(newSegment, newOffset) {
        if (newSegment) timeSegment = standardizeInt(MIN_SEGMENT, newSegment);
        if (newOffset) timeOffset = standardizeInt(MIN_OFFSET, newOffset);
        if (this.isStopped()) return this;
        return this.stop().start();
    }

    this.isRunning = function() {
        return (taskHandler != null);
    }

    this.isStopped = function() {
        return (taskHandler == null);
    }

    if (activated) this.start();
}

module.exports = Timer;
