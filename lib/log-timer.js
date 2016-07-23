'use strict';

function Timer(fn, t, deferred) {
    var taskInterval = t;
    var taskHandler = null;

    if (!deferred) {
      taskHandler = setInterval(fn, taskInterval);
    }

    this.start = function() {
        if (!taskHandler) {
            taskHandler = setInterval(fn, taskInterval);
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

    this.reset = function(newT, delayed) {
        if (newT) taskInterval = newT;
        if (this.isStopped()) return this;
        return this.stop().start();
    }

    this.isRunning = function() {
        return (taskHandler != null);
    }

    this.isStopped = function() {
        return (taskHandler == null);
    }
}

module.exports = Timer;
