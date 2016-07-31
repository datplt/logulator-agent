'use strict';

var MIN_PERIOD = 10;
var MIN_OFFSET = 0;

function standardizeInt(min, number) {
  return (number > min) ? number : min;
}

function getRandomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function Timer(params, taskPeriod, taskOffset, tickCallback, tickPeriod, activated) {
    var taskCallback = function() {};

    if (params) {
      if (typeof (params) == 'object') {
        taskCallback = params.taskCallback;
        taskPeriod = params.taskPeriod;
        taskOffset = params.taskOffset;
        tickCallback = params.tickCallback;
        tickPeriod = params.tickPeriod;
        activated = params.activated;
      } else if (typeof(params) == 'function') {
        taskCallback = params;
      }
    }

    taskPeriod = standardizeInt(MIN_PERIOD, taskPeriod);
    taskOffset = standardizeInt(MIN_OFFSET, taskOffset);
    var taskHandler = null;

    tickCallback = tickCallback || function() {};
    tickPeriod = tickPeriod || 10000;
    var tickHandler = null;
    var tickCounter = 0;

    this.start = function() {
        var taskWrapper = function() {
          tickCounter++;
          params();
        };
        if (!taskHandler) {
            var taskFunction = taskWrapper;
            if (taskOffset > 0) {
              taskFunction = function() {
                setTimeout(taskWrapper, getRandomInt(0, taskOffset));
              };
            }
            taskHandler = setInterval(taskFunction, taskPeriod);
        }
        if (!tickHandler) {
          tickHandler = setInterval(function() {
            tickCallback && tickCallback(tickCounter);
            tickCounter = 0;
          }, tickPeriod);
        }
        return this;
    }

    this.stop = function() {
        if (taskHandler) {
            clearInterval(taskHandler);
            taskHandler = null;
        }
        if (tickHandler) {
          clearInterval(tickHandler);
          tickHandler = null;
        }
        return this;
    }

    this.reset = function(newPeriod, newOffset) {
        if (newPeriod) taskPeriod = standardizeInt(MIN_PERIOD, newPeriod);
        if (newOffset) taskOffset = standardizeInt(MIN_OFFSET, newOffset);
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
