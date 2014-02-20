var Hapi = require('hapi');
var Promise = require('bluebird');

//
// Import Hoek Utilities
//
for (var i in Hapi.utils) {
  if (Hapi.utils.hasOwnProperty(i)) {
    exports[i] = Hapi.utils[i];
  }
}

exports.error    = Hapi.error;
exports.boom     = Hapi.error;
exports.joi      = require('joi');
exports.is       = require('is');
exports.path     = require('path');
exports.url      = require('url');
exports.fs       = require('graceful-fs');
exports.glob     = require('glob');
exports.chalk    = require('chalk');
exports.string   = require('string');
exports.Promise  = Promise;
exports.request  = Promise.promisify(require('request'));
exports.fakeLog  = fakeLog;

function fakeLog() {

  var Dummy = function() {
    this.logs = [];
  };

  Dummy.prototype.getLogs = function() {
    return this.logs;
  };

  ['trace', 'verbose', 'debug', 'info', 'warn', 'error', 'critical'].forEach(function(level) {
    Dummy.prototype[level] = function() {
      this.logs.push({
        level: level,
        args: arguments
      });
    };
  });

  return new Dummy();
}
