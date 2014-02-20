var util       = require('util');
var hapi       = require('hapi');
var confidence = require('confidence');
var intel      = require('intel');
var Registry   = require('./Registry');
var utils      = require('./utils');

var pkg        = utils.loadPackage;
var cyan       = utils.chalk.cyan;
var resolve    = utils.path.resolve;
var basename   = utils.path.basename;
var defaults   = utils.applyToDefaults;

//
// App Constructor
//
var Nails = function(opts) {

  // Apply default options
  opts = defaults({
    base:   process.cwd(),
    env:    process.env.NODE_ENV ? process.env.NODE_ENV.toLowerCase() : 'development',
    config: 'config',
    pack:   {
      cache:  {
        engine:    'memory',
        partition: 'app'
      }
    }
  }, opts || {});

  this._nails  = pkg(__dirname);
  this.options = opts;
  this.base    = opts.base;
  this.env     = opts.env;
  this.pkg     = pkg(this.base);
  this.name    = opts.name    || basename(this.base);
  this.version = opts.version || this.pkg.version;
  this.hapi    = hapi;
  this.utils   = utils;
  this.logger  = intel;

  this.log.info('Application: %s %s', cyan(this.name), cyan('v' + this.version));
  this.log.info('Environment: %s\n', cyan(this.env));

  this.init('config');
  this.init('logger');
  this.init('cache');
  this.init('pack');
  this.init('plugins');
  this.init('resources');
};


//
// Expose Config
//
Nails.prototype.config = new confidence.Store();


//
// Expose Default Logger
//
Nails.prototype.log = intel.getLogger('app');


//
// Expose Generic Registry
//
Nails.prototype.Registry = Registry;


//
// Expose Resource Registry
//
Nails.prototype.resource = new Registry('Resource');


//
// Expose Database Registry
//
Nails.prototype.database = new Registry('Database');


//
// Load Configuration
//
Nails.prototype.loadConfig = function loadConfig(configPath) {
  var self = this;
  var config = {};
  var filename = resolve(this.base, configPath);

  if(!utils.fs.existsSync(filename)) {
    throw new Error('Could not load configuration from ' + configPath + ' - Path does not exist.');
  }

  var stats = utils.fs.statSync(filename);

  if(stats.isDirectory()) {
    var files = utils.glob.sync(filename + '/*.{js,json}');

    files.forEach(function (file) {
      var ext  = utils.path.extname(file);
      var name = basename(file, ext);

      config[name] = require(file);
      self.log.info('Configured:  ' + utils.chalk.cyan(name));
    });
  }
  else {
    config = require(file);
    this.log.info('Configured:  ' + utils.chalk.cyan(basename(file)));
  }

  this.config.load(config);

  return this;
};


//
// Require a plugin
//
Nails.prototype.require = function requirePlugin(names, options, callback) {
  var self = this;

  if(Array.isArray(names) && typeof options === 'function') {
    callback = options;
    options = {};
  }

  options = options || {};

  if(Array.isArray(names)) {
    this.pack.require(names, function(err) {
      if(err) throw err;

      names.forEach(function(name) {
        self.log.info('Loaded plugin: ' + cyan(name));
      });

      if(callback) return callback(err);
    });
  }
  else {
    this.pack.require(names, options, function(err) {
      if(err) throw err;

      self.log.info('Loaded plugin: ' + cyan(names));

      if(callback) return callback(err);
    });
  }
  return this;
};


//
// Register a plugin
//
Nails.prototype.register = function registerPlugin(plugin, options, callback) {
  var self = this;

  if(typeof options === 'function') {
    callback = options;
    options = {};
  }

  options = options || {};

  this.pack.register(plugin, options, function(err) {
    if(err) throw err;

    self.log.info('Loaded plugin: ' + utils.chalk.cyan(plugin.name));

    if(callback) return callback(err);
  });
};


//
// Register all plugins in a given directory
//
Nails.prototype.registerAll = function registerAll(dir, options) {
  var self = this;

  if(typeof options === 'function') {
    callback = options;
    options = {};
  }

  options = options || {};

  dir = resolve(this.base, dir || 'plugins');
  var stats = utils.fs.statSync(dir);

  utils.assert(stats.isDirectory(), 'registerAll could not find the directory specified: ' + dir);

  var files = utils.glob.sync(
    '{' +
    dir + '/*.js,' +
    dir + '/**/*.js' +
    '}'
  );

  files.forEach(function (file) {
    var plugin = require(file);

    utils.assert(plugin, 'Invalid Plugin: ' + file);
    utils.assert(plugin.name, 'Plugin missing name: ' + file);
    utils.assert(plugin.version, 'Plugin missing version: ' + file);
    utils.assert(plugin.register && typeof plugin.register === 'function', 'Plugin missing register() method');

    self.register(plugin, options[plugin.name] || {});
  });
};


//
// Create a server
//
Nails.prototype.createServer = function createServer(host, port, options) {
  var self   = this;
  var logger = this.logger.getLogger('app.request');
  var server = this.pack.server.apply(this.pack, Array.prototype.slice.call(arguments));

  server.on('log', function(event, tags) {
    var data;
    var level = 'info';
    if (tags.debug) level = 'debug';
    if (tags.info)  level = 'info';
    if (tags.warn)  level = 'warn';
    if (tags.error) level = 'error';

    data = util.format(event.data);

    self.log[level](data);
  });

  server.on('request', function(request, event, tags) {

    if (tags.error && util.isError(event.data)) {
      var err = event.data;

      if (err.isBoom && err.output.statusCode < 500) {
        logger.warn(
          utils.chalk.yellow.bold('%d') + utils.chalk.bold(' %s ') + utils.chalk.red('%s'),
          err.output.statusCode,
          request.method.toUpperCase(),
          err.message
        );
      }
      else {
        logger.error(utils.chalk.red('%s'), err);
      }
    }

  });

  // response logging
  server.on('response', function(request) {

    var access = {
      ip: request.info.remoteAddress,
      time: new Date(),
      method: request.method.toUpperCase(),
      url: request.url.path,
      agent: request.headers['user-agent'],
      referer: request.headers.referer || request.headers.referrer || '-',
      http_ver: request.raw.req.httpVersion,
      length: request.response.headers['content-length'],
      status: request.response.statusCode,
      color: 'green',
      response_time: new Date().getTime() - request.info.received
    };

    if (access.status >= 500) access.color = 'red';
    else if (access.status >= 400) access.color = 'yellow';
    else if (access.status >= 300) access.color = 'cyan';

    logger.info(
      utils.chalk[access.color].bold('%d') + utils.chalk.bold(' %s ') + utils.chalk.grey('%s') + utils.chalk.magenta(' (%s, %dms)'),
      access.status,
      access.method,
      access.url,
      access.ip,
      access.response_time
    );
  });

  return server;
};


//
// Start all servers
//
Nails.prototype.start = function startServers(callback) {
  var self = this;

  this.pack.start(function() {
    self.pack._servers.forEach(function(server) {
      var info = server.info.uri;
      if(server.settings.labels && server.settings.labels.length) {
        info = utils.chalk.cyan(info) + ' (' + utils.chalk.magenta(server.settings.labels.join(', ')) + ')';
      }
      self.log.info('Started server: ' + info);
    });

    if(callback) return callback();
    else return this;
  });
};


//
// Stop all servers
//
Nails.prototype.stop = function stopServers(options, callback) {

  if(typeof options === 'function') {
    callback = options;
    options = {};
  }

  options = utils.applyToDefaults({
    timeout: 30 * 1000
  }, options);

  this.pack.stop(options, function() {
    this.log.info('All servers stopped');
    if(callback) return callback();
    else return this;
  });
};


//
// Initialize
//
Nails.prototype.init = function(task) {
  var self = this;
  var opts = this.options;
  var conf = this.config;

  var init = {

    config: function() {
      if(opts.config) {
        self.loadConfig(opts.config);
      }
      console.log();
    },


    resources: function() {
      self.resource.register('instagram', require('./resources/instagram'));
      self.resource.register('twitter', require('./resources/twitter'));
    },


    cache: function() {
      opts.pack.cache = conf.get('/cache', { env: self.env }) || opts.pack.cache;
    },


    pack: function() {
      self.pack = new self.hapi.Pack(opts.pack);
      self.pack.app = self;
    },


    plugins: function() {
      self.require('hapi-promise');
    },


    logger: function() {
      var logConfig = conf.get('/logging', { env: self.env });

      // Look for 'file' handlers and ensure they have a relative path
      // Needs replacing
      if(logConfig && logConfig.handlers) {
        Object.keys(logConfig.handlers).forEach(function(handler) {
          handler = logConfig.handlers[handler];
          if(handler && handler.class === 'intel/handlers/file' && handler.file) {
            handler.file = resolve(self.base, handler.file);
          }
        });
      }

      self.logger.config(logConfig);
      self.log = self.logger.getLogger('app');
    }

  };

  return init[task]();
};


//
// createApplication - Returns a new Nails instance
//
module.exports = function createApplication(options) {
  return new Nails(options);
};

exports.utils = utils;
