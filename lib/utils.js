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

exports.error   = Hapi.error;
exports.boom    = Hapi.error;
exports.joi     = require('joi');
exports.path    = require('path');
exports.url     = require('url');
exports.fs      = require('graceful-fs');
exports.glob    = require('glob');
exports.chalk   = require('chalk');
exports.Promise = Promise;
exports.request = Promise.promisify(require('request'));

exports.isObject = function(obj) {
  return typeof obj === 'object' && obj !== null;
};

exports.isString = function(str) {
  return typeof str === 'string';
};

exports.version = function () {
  return exports.loadPackage(__dirname + '/..').version;
};


