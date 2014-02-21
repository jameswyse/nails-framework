var utils    = require('../../utils');
var Registry = require('../../Registry');
var defaults = utils.applyToDefaults;
var assert   = utils.assert;
var url      = utils.url;

//
// Exports
//
module.exports = new Instagram();
exports.Instagram = Instagram;


//
// Constructor
//
function Instagram(options) {
  if(options) this.configure(options);
}


//
// Init function for configuration
//
Instagram.prototype.configure = function(options) {
  assert(options.client_id, 'Instagram API client_id missing.');
  assert(options.client_secret, 'Instagram API client_secret missing.');
  assert(options.callback_url, 'Instagram API callback_url missing.');

  // Merge options with defaults
  this.options = defaults({
    base: 'https://api.instagram.com/v1/',
    engine: 'hapi',
    aspect: 'media'
  }, options || {});

  // Setup base URL
  this.base = this.options.base;
  delete this.options.base;

  // Setup engine for route generation
  assert(this.options.engine === 'hapi', 'Invalid Engine. Only Hapi is supported');
  this.engine = this.options.engine;
  delete this.options.engine;

  // Setup routes
  var routes = require('./routes/' + this.engine).call(this);
  this.route.import(routes);

  return this;
};


//
// Route registry
//
Instagram.prototype.route = new Registry('Route');


//
// URL formatter
//
Instagram.prototype.url = function(endpoint, query) {
  var uri = url.parse(this.base);

  uri.pathname = uri.pathname + endpoint;

  if(query) {
    if(query === true) uri.query = this.options;
    else uri.query = query;
  }

  return url.format(uri);
};


//
// Subscribe
//
Instagram.prototype.subscribe = function(options) {
  var req = {
    uri: this.url('subscriptions'),
    method: 'POST',
    json: true,
    form: defaults(this.options, options)
  };

  return utils.request(req);
};


//
// Get
//
Instagram.prototype.getTag = function(tag) {
  var req = {
    uri: this.url('tags/' + tag + '/media/recent', {
      client_id: this.options.client_id,
      client_secret: this.options.client_secret
    }),
    method: 'GET',
    json: true
  };

  return utils.request(req);
};
