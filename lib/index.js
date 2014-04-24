var App   = require('./App');
var utils = require('nails-utils');

// Creates a new App instance
module.exports = function createApplication(options) {
  return new App(options);
};

exports.App   = App;
exports.utils = utils;
