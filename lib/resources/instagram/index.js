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
  // Expose Schema
  this.schema = require('./schema');

  // Expose Formatter
  this.formatter = require('./formatter');

  // run configure if options were passed
  if(options) this.configure(options);
}


//
// Init function for configuration
//
Instagram.prototype.configure = function(options) {
  // Check options
  assert(options.client_id, 'Instagram API client_id missing.');
  assert(options.client_secret, 'Instagram API client_secret missing.');
  assert(options.callback_url, 'Instagram API callback_url missing.');

  // Merge options with defaults
  this.options = defaults({
    base: 'https://api.instagram.com/v1/',
    aspect: 'media'
  }, options || {});

  // Set base URL
  this.base = this.options.base;
  delete this.options.base;

  // Import routes
  var routes = require('./routes').call(this);
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
Instagram.prototype.subscribe = function(options, callback) {
  var req = {
    uri: this.url('subscriptions'),
    method: 'POST',
    json: true,
    form: defaults(this.options, options)
  };

  utils.request(req, function(err, res, body) {
    if(err) return callback(err);

    if(!body || !body.meta || body.meta.code >= 400) {
      return callback(new Error(meta.error_type + ': ' + meta.error_message));
    }

    return callback(null, body.data);
  });
};


//
// Get Recent Tags
//
Instagram.prototype.getTag = function(tag, query, callback) {
  var self = this;

  if(typeof query === 'function') {
    callback = query;
    query = {};
  }
  query = query || {};

  var req = {
    uri: this.url('tags/' + tag + '/media/recent', {
      client_id: this.options.client_id,
      client_secret: this.options.client_secret
    }),
    method: 'GET',
    json: true
  };

  utils.request(req, function(err, res, body) {
    if(err) return callback(err);

    if(!body || !body.meta || body.meta.code >= 400) {
      return callback(new Error(meta.error_type + ': ' + meta.error_message));
    }

    body.data = body.data
      .filter(function(post) {
        return post.type !== 'image';
      })
      .map(function(post) {
        return self.formatter(post);
      });

    return callback(null, body.data);
  });
};
