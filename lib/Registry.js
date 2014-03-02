/**
 * A generic registry / service locator
 */

// Module Dependencies
var utils = require('nails-utils');


//
// Registry Constructor
//
var Registry = module.exports = function(name) {
  this.name = name || 'Item';
  this.list = {};
};

//
// Get a single item
//
Registry.prototype.get = function(name) {
  var service = this.list[name];
  utils.assert(service, this.name + ' not found: ' + name);
  return service;
};

//
// Get all items
//
Registry.prototype.all = function() {
  return this.list;
};

//
// Get all keys
//
Registry.prototype.keys = function() {
  return Object.keys(this.list);
};

//
// Register an item
//
Registry.prototype.register = function(name, item) {
  utils.assert(!this.list[name], this.name + ' already exits: ' + name);
  this.list[name] = item;
  return this;
};

//
// Remove an item
//
Registry.prototype.remove = function(name) {
  utils.assert(!this.list[name], this.name + ' not found: ' + name);
  delete this.list[name];
  return this;
};

//
// Clear all items
//
Registry.prototype.clear = function() {
  this.list = {};
  return this;
};

//
// Import items
//
Registry.prototype.import = function(items) {
  this.list = items;
  return this;
};
