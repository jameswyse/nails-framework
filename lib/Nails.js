//
// Module Dependencies
//
var util       = require('util');
var hapi       = require('hapi');
var confidence = require('confidence');
var intel      = require('intel');
var Registry   = require('./Registry');
var utils      = require('./utils');

//
// Refs to often used functions
//
var is         = utils.is;
var pkg        = utils.loadPackage;
var cyan       = utils.chalk.cyan;
var assert     = utils.assert;
var glob       = utils.glob.sync;
var resolve    = utils.path.resolve;
var basename   = utils.path.basename;
var defaults   = utils.applyToDefaults;

//
// App Constructor
//
var Nails = function(opts) {

  // Apply default options
  opts = defaults({
    env:    process.env.NODE_ENV ? process.env.NODE_ENV.toLowerCase() : 'development',
    base:   process.cwd(),
    plugins: [],
    pack:   {
      cache:  {
        engine:    'memory',
        partition: 'app'
      }
    }
  }, opts || {});

  // Common properties
  this.options = opts;
  this.base    = opts.base;
  this.env     = opts.env;
  this.pkg     = pkg(this.base);
  this.name    = opts.name    || this.pkg.name;
  this.version = opts.version || this.pkg.version;

  // Common utilities
  this.hapi    = hapi;
  this.utils   = utils;
  this.logger  = intel;

  // Initialize
  this.log.info('Application: %s %s', cyan(this.name), cyan('v' + this.version));
  this.log.info('Environment: %s', cyan(this.env));
  this.init();
};

Nails.prototype.log      = utils.fakeLog();
Nails.prototype.config   = new confidence.Store();
Nails.prototype.Registry = Registry;
Nails.prototype.resource = new Registry('Resource');
Nails.prototype.database = new Registry('Database');

//
// Option helper - Access `this.options` using dot notation
//
Nails.prototype.option = function(chain) {
  return utils.reach(this.options, chain);
};

//
// Initialize
//
Nails.prototype.init = function() {
  var self = this;
  var conf = this.config;
  var opt  = this.option.bind(this);

  //
  // Load configuration
  //
  if(opt('config')) {
    this.loadConfig(opt('config'));
  }

  //
  // Configure logger
  //
  var logConfig = conf.get('/logging', { env: self.env });
  var messages = this.log.getLogs();

  if(logConfig && logConfig.handlers) {
    // Resolve file paths
    var handlers = logConfig.handlers;

    Object.keys(handlers)
      .filter(function(handler) {
        return handlers[handler].class === 'intel/handlers/file' && handlers[handler].file;
      })
      .forEach(function(handler) {
        handlers[handler].file = resolve(self.base, handlers[handler].file);
       });


    this.logger.config(logConfig);
    this.log = this.logger.getLogger('app');

    messages.forEach(function(msg) {
      self.log[msg.level].apply(self.log, msg.args);
    });
  }
  else {
    this.log = this.logger.getLogger('app');
    messages.forEach(function(msg) {
      self.log[msg.level].apply(self.log, msg.args);
    });
  }

  //
  // Apply cache options
  //
  this.options.pack.cache = conf.get('/cache', { env: self.env }) || opt('pack.cache');

  //
  // Create pack
  //
  this.pack = new hapi.Pack(opt('pack'));
  this.pack.app = this;

  //
  // Register Servers
  //
  var servers = opt('servers') || [];

  servers.forEach(function(serverConfig) {
    serverConfig = defaults({
      host: '0.0.0.0',
      port: '3000',
      options: {}
    }, serverConfig);

    self.server(serverConfig.port, serverConfig.host, serverConfig.options);
  });


  //
  // Register configured databases
  //
  var databases = conf.get('/databases', { env: this.env });
  if(databases) {
    Object.keys(databases).forEach(function(name) {
      var db = require('./databases/' + name);
      self.database.register(name, db.call(self, databases[name]));
    });
  }

  //
  // Register resources
  //
  this.resource.register('instagram', require('./resources/instagram'));
  this.resource.register('twitter', require('./resources/twitter'));

  //
  // Load System Plugins
  //
  this.pack.require(['hapi-promise'], function(err) {
    if(err) throw err;
  });

  //
  // Load User Plugins
  //
  var plugins = opt('plugins');

  if(!is.array.empty(plugins)) {
    plugins.forEach(function(pattern) {
      self.plugin(pattern);
    });
  }

};



//
// Load plugin files from a glob String
//
Nails.prototype.plugin = function usePlugin(pattern, options) {
  assert(is.string(pattern), 'Missing glob pattern');
  options = options || {};

  var self = this;
  var S = utils.string(pattern);

  // Turn simple paths in to glob patterns
  if(!S.endsWith('.js') && !S.contains('*')) {
    pattern = pattern + '/**/*.js';
  }

  // Perform glob
  var files = glob(pattern, {
    cwd: this.base,
    mark: true
  });

  assert(!is.array.empty(files), 'No modules were found');

  var single = files.length === 1;

  files.forEach(function(file) {
    var plugin = require(resolve(self.base, file));

    assert(is.string(plugin.name), 'Invalid Plugin: Missing exports.name');
    assert(is.defined(plugin.version), 'Invalid Plugin: Missing exports.version');
    assert(is.fn(plugin.register), 'Invalid Plugin: Missing exports.register()');

    // Register
    self.pack.register(plugin, single ? options : options[plugin.name] || {}, function(err) {
      if(err) throw err;
      self.log.info('Loaded plugin: ' + cyan(plugin.name));
    });
  });
};



//
// Load Configuration
//
Nails.prototype.loadConfig = function loadConfig(configPath) {
  var self = this;
  var obj = {};
  var filename = resolve(this.base, configPath);

  assert(utils.fs.existsSync(filename), 'Configuration path not found: ' + configPath);

  if(utils.fs.statSync(filename).isDirectory()) {
    glob(filename + '/*.{js,json}')
      .forEach(function (file) {
        var ext  = utils.path.extname(file);
        var name = basename(file, ext);

        obj[name] = require(file);
    });
    this.log.info('Loaded config: ' + cyan('%s'), Object.keys(obj).join(', '));
  }
  else {
    obj = require(filename);
    this.log.info('Loaded config: ' + cyan(basename(filename)));
  }


  this.config.load(obj);
  // this.log.info('Loaded configuration');

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

    names = names.map(function(name) {
      return resolve(this.base, 'node_modules', name);
    });

    this.pack.require(names, function(err) {
      if(err) throw err;

      names.forEach(function(name) {
        self.log.info('Loaded plugin: ' + cyan(basename(name)));
      });

      if(callback) return callback(err);
    });
  }
  else {
    names = resolve(this.base, 'node_modules', names);
    this.pack.require(names, options, function(err) {
      if(err) throw err;

      self.log.info('Loaded plugin: ' + cyan(basename(names)));

      if(callback) return callback(err);
    });
  }
  return this;
};

//
// Create a server
//
Nails.prototype.server = function createServer(host, port, options) {
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
        info = cyan(info) + ' (' + utils.chalk.magenta(server.settings.labels.join(', ')) + ')';
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

  options = defaults({
    timeout: 30 * 1000
  }, options);

  this.pack.stop(options, function() {
    this.log.info('All servers stopped');
    if(callback) return callback();
    else return this;
  });
};


//
// createApplication - Returns a new Nails instance
//
module.exports = function createApplication(options) {
  return new Nails(options);
};

exports.utils = utils;
