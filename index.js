////////////////////////////////////
// Nails Framework - Core Library //
////////////////////////////////////

//
// Module Dependencies
//
require('colors');
var path          = require('path');
var EventEmitter2 = require('eventemitter2').EventEmitter2;

/**
 * Export the main application
 *
 * @type {EventEmitter2}
 */
var app = module.exports = new EventEmitter2({
  wildcard: true,
  delimiter: '.',
  newListener: false,
  maxListeners: 0
});

/**
 * Determines the correct working directory
 */
var rel = path.relative(process.cwd(), path.dirname(process.mainModule.filename));
if(rel) process.chdir(rel);
app.root = process.cwd();

/**
 * Loads package.json
 *
 * @type {Object}
 */
try { app.pkg = require(path.resolve(app.root, 'package.json')); }
catch(e) {
  app.pkg = require(path.resolve(__dirname, 'package.json'));
}

/**
 * Determines the current environment
 *
 * @type {String}
 */
app.env = process.env.NODE_ENV ? process.env.NODE_ENV.toLowerCase() : 'development';

/**
 * Store Temp Data
 *
 * @type {Object}
 */
app.__ = {
  plugins: {}
};

// Load system plugins
require('nails-config');
require('nails-logger');

// Display Welcome Message
app.log.info('');
app.log.info('Nails Framework v0.0.1');
app.log.info('');
app.log.info('Name:           ' + app.pkg.name.cyan);
app.log.info('Description:    ' + app.pkg.description.cyan);
app.log.info('Version:        ' + app.pkg.version.cyan);
app.log.info('Environment:    ' + app.env.cyan);
app.log.info('');
