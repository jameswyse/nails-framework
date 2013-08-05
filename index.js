////////////////////////////////////
// Nails Framework - Core Library //
////////////////////////////////////


//
// Module Dependencies
//
var path          = require('path');
var fs            = require('fs');
var resolve       = require('resolveit');
var EventEmitter2 = require('eventemitter2').EventEmitter2;

//
// Export the main application
// Inherits from EventEmitter2
//
var app = module.exports = new EventEmitter2({
  wildcard: true,
  delimiter: '.',
  newListener: false,
  maxListeners: 0
});

//
// Determine the correct working directory
//
var rel = path.relative(process.cwd(), path.dirname(process.mainModule.filename));
if(rel) process.chdir(rel);
app.root = process.cwd();

//
// Load package.json
//
try { app.pkg = require(path.resolve(app.root, 'package.json')); }
catch(e) {
  app.pkg = require(path.resolve(__dirname, 'package.json'));
}

//
// Determine Environment
//
app.env = process.env.NODE_ENV ? process.env.NODE_ENV.toLowerCase() : 'development';

//
// Temp Data
//
app.__ = {
  plugins: {}
};

//
// Load system plugins
//
require('nails-config');
require('nails-logger');

//
// Display Welcome Message
//
app.log.info('');
app.log.info('Nails Framework v0.0.1');
app.log.info('');
app.log.info('Name:           ' + app.pkg.name.cyan);
app.log.info('Description:    ' + app.pkg.description.cyan);
app.log.info('Version:        ' + app.pkg.version.cyan);
app.log.info('Environment:    ' + app.env.cyan);
app.log.info('');
