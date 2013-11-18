////////////////////////////////////
// Nails Framework - Core Library //
////////////////////////////////////

//
// Module Dependencies
//
require('colors');
var path          = require('path');
var fs            = require('fs');
var EventEmitter2 = require('eventemitter2').EventEmitter2;
var _             = require('lodash');
var locator       = require('servicelocator');
var bootable      = require('bootable');
var util          = require('util');
var config        = require('nails-config');
var logger        = require('nails-logger');

//
// Application Factory
//
module.exports = function(options) {
  var app = new App(options);
  bootable(app);

  return app;
};

//
// Application Constructor
//
var App = function(options) {
  var self = this;

  self.types = {
    Registry: require('./lib/types/Registry')
  };

  self._ = _;

  // Determine the correct working directory
  var rel = path.relative(process.cwd(), path.dirname(process.mainModule.filename));
  if(rel) process.chdir(rel);
  self.root = process.cwd();

  // Determine the environment
  self.env = process.env.NODE_ENV ? process.env.NODE_ENV.toLowerCase() : 'development';

  // Load package.json
  try      { self.pkg = require(path.resolve(self.root, 'package.json')); }
  catch(e) { self.pkg = require(path.resolve(__dirname, 'package.json')); }

  // Load system plugins
  self.use(config);
  self.use(logger);

  // Display Welcome Message
  self.log.info('');
  self.log.info('Nails Framework v0.0.2');
  self.log.info('');
  self.log.info('Name:           ' + self.pkg.name.cyan);
  self.log.info('Description:    ' + self.pkg.description.cyan);
  self.log.info('Version:        ' + self.pkg.version.cyan);
  self.log.info('Environment:    ' + self.env.cyan);
  self.log.info('');
};

util.inherits(App, EventEmitter2);

//
// Plugin Loader
//
App.prototype.use = function(plugins) {
  var args = _.rest(arguments);
  var self = this;

  if(!Array.isArray(plugins)) plugins = [plugins];

  plugins.forEach(function(plugin) {
    if(_.isFunction(plugin)) plugin.call(self, self, args);
  });

  return self;
};

App.prototype.useAll = function(dir, options) {
  var self = this;
  var modules = [];

  options = options || {};
  options.base = options.base || self.root || __dirname;
  options.ext = options.ext || '.js';

  dir = path.resolve(options.base, dir);

  fs.readdirSync(dir)
    .map(function(filename) {
      return path.resolve(dir, filename);
    })
    .filter(function(filename) {
      return fs.statSync(filename).isFile() && path.extname(filename) === options.ext;
    })
    .forEach(function(filename) {
      modules.push(require(filename));
    });

  return self.use(modules);
};

App.prototype.all = App.prototype.useAll;

//
// Service Locator
//
App.prototype.service = locator;
