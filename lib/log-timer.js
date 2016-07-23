'use strict';

function Timer(fn, t, deferred) {
    var timerObj = null;

    if (!deferred) {
      timerObj = setInterval(fn, t);
    }

    this.stop = function() {
        if (timerObj) {
            clearInterval(timerObj);
            timerObj = null;
        }
        return this;
    }

    this.start = function() {
        if (!timerObj) {
            this.stop();
            timerObj = setInterval(fn, t);
        }
        return this;
    }

    this.reset = function(newT, delayed) {
        if (newT) t = newT;
        if (delayed) return this;
        return this.stop().start();
    }

    this.isRunning = function() {
        return (timerObj != null);
    }

    this.isStopped = function() {
      return !this.isRunning();
    }
}

module.exports = Timer;
