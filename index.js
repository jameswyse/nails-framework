////////////////////////////////////
// Nails Framework - Core Library //
////////////////////////////////////

//
// Module Dependencies
//
require('colors');
var path          = require('path');
var EventEmitter2 = require('eventemitter2').EventEmitter2;
var lodash        = require('lodash');
var util          = require('util');

var config        = require('nails-config');
var logger        = require('nails-logger');

var Nails = module.exports = function() {
  return new App();
};

var App = function() {
  var self = this;

  // Determine the correct working directory
  var rel = path.relative(process.cwd(), path.dirname(process.mainModule.filename));
  if(rel) process.chdir(rel);
  self.root = process.cwd();

  // Load package.json
  try { self.pkg = require(path.resolve(self.root, 'package.json')); }
  catch(e) { self.pkg = require(path.resolve(__dirname, 'package.json')); }

  // Determine the environment
  self.env = process.env.NODE_ENV ? process.env.NODE_ENV.toLowerCase() : 'development';

  // Bundle Lodash
  self._ = lodash;

  // Load system plugins
  self.use(config);
  self.use(logger);

  // Display Welcome Message
  self.log.info('');
  self.log.info('Nails Framework v0.0.1');
  self.log.info('');
  self.log.info('Name:           ' + self.pkg.name.cyan);
  self.log.info('Description:    ' + self.pkg.description.cyan);
  self.log.info('Version:        ' + self.pkg.version.cyan);
  self.log.info('Environment:    ' + self.env.cyan);
  self.log.info('');
};

util.inherits(self, EventEmitter2);

App.prototype.use = function(plugins) {
  var args = [].prototype.slice(arguments, 1);
  console.dir(args);
  if(!_.isArray(plugins)) plugins = [plugins];

  _.each(plugins, function(plugin) {
    if(_.isFunction(plugin)) plugin.call(self, self, args);
  });
};

