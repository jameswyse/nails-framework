//
// Module Dependencies
//
var util       = require('util');
var hapi       = require('hapi');
var intel      = require('intel');
var utils      = require('./utils');
var Agenda     = require('agenda');
var Registry   = require('./Registry');
var confidence = require('confidence');

//
// Shortcuts
//
var is         = utils.is;
var pkg        = utils.loadPackage;
var cyan       = utils.chalk.cyan;
var red        = utils.chalk.red;
var assert     = utils.assert;
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
  this.log.info('Environment: %s\n', cyan(this.env));
  this.init();
};

//
// Prototype Methods
//
Nails.prototype.log      = utils.fakeLog();
Nails.prototype.Registry = Registry;
Nails.prototype.task     = new Agenda();
Nails.prototype.resource = new Registry('Resource');
Nails.prototype.database = new Registry('Database');
Nails.prototype.cache    = new Registry('Cache');
Nails.prototype.config   = new confidence.Store();

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
  // Init: Config Files
  //
  var configFiles = opt('config');
  if(!is.array(configFiles)) configFiles = [configFiles];

  configFiles.forEach(self.loadConfig, self);

  //
  // Init: Logger
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
  // Init: Cache
  //
  this.options.pack.cache = conf.get('/cache', { env: self.env }) || opt('pack.cache');

  //
  // Init: Hapi.Pack
  //
  this.pack = new hapi.Pack(opt('pack'));
  this.pack.app = this;

  //
  // Init: Servers
  //
  var servers = opt('servers') || conf.get('/servers') || [];

  servers.forEach(function(serverConfig) {
    serverConfig = defaults({
      host: '0.0.0.0',
      port: '3000',
      options: {}
    }, serverConfig);

    self.server(serverConfig.port, serverConfig.host, serverConfig.options);
  });


  //
  // Init: Databases
  //
  var databases = conf.get('/databases', { env: this.env });
  if(databases) {
    Object.keys(databases).forEach(function(name) {
      var db = require('./databases/' + name);
      self.database.register(name, db.call(self, databases[name]));
    });
  }


  //
  // Init: Resources
  //
  this.resource.register('instagram', require('./resources/instagram'));
  this.resource.register('twitter', require('./resources/twitter'));

  //
  // Init: Framework Plugins
  //
  var plugins = {
    'hapi-promise': {},
    'hapi-named-routes': {},
    'scooter': {}
  };

  var sessions = conf.get('/sessions');
  if(sessions) plugins.yar = sessions;

  this.pack.require(plugins, function(err) {
    if(err) throw err;
  });

  //
  // Init: App Plugins
  //
  var appPlugins = opt('plugins');

  if(!is.array.empty(appPlugins)) {
    appPlugins.forEach(self.plugin, self);
  }

  //
  // Init: Tasks
  //
  var tasks    = opt('tasks');
  var mongoURL = conf.get('/databases/mongodb/url', { env: this.env });

  if(tasks && mongoURL) {
    var taskLogger = self.logger.getLogger('app.task');

    this.task
      .database(mongoURL, 'tasks')
      .processEvery('5 seconds')
      .maxConcurrency(20)
      .defaultConcurrency(5)
      .on('success', function(job) {
        taskLogger.info('Task Complete: %s', cyan(job.attrs.name));
      })
      .on('fail', function(err, job) {
        taskLogger.warn('Task Failed: %s', red(job.attrs.name));
        if(err) taskLogger.error(err);
      });

    if(!is.array(tasks)) tasks = [tasks];
    tasks.forEach(self.loadTasks, self);
  }
  else delete this.task;

  console.log();
};


//
// Load Plugins
//
Nails.prototype.plugin = function usePlugin(pattern, options) {
  assert(is.string(pattern), 'Missing glob pattern');
  options = options || {};

  var self  = this;
  var found = [];

  utils.finder({
    pattern: pattern,
    cwd: this.base
  }, function(file, total) {
      var plugin = require(file);

      assert(is.string(plugin.name),     'Invalid Plugin: Missing exports.name');
      assert(is.defined(plugin.version), 'Invalid Plugin: Missing exports.version');
      assert(is.fn(plugin.register),     'Invalid Plugin: Missing exports.register()');

      var single = total === 1;

      // Register
      self.pack.register(plugin, single ? options : options[plugin.name] || {}, function(err) {
        if(err) throw err;
        found.push(plugin.name);
      });
  });

  if(found.length) self.log.info('Loaded plugins: ' + cyan(found.join(', ')));
};


//
// Load Configuration Files
//
Nails.prototype.loadConfig = function loadConfig(pattern) {
  var obj  = this.config.get('/');
  var found = [];

  utils.finder({
    pattern: pattern,
    cwd: this.base
  }, function(file, total) {
      var ext  = utils.path.extname(file);
      var name = basename(file, ext);

      obj[name] = require(file);
      found.push(name);
  });

  this.log.info('Loaded configs: ' + cyan('%s'), found.join(', '));
  this.config.load(obj);

  return this;
};


//
// Load Tasks
//
Nails.prototype.loadTasks = function loadTasks(pattern) {
  var self  = this;
  var found = [];

  utils.finder({
    pattern: pattern,
    cwd: this.base
  }, function(file) {
       var task = require(file);

       // Exposes app and a custom logger on the task object
       // Not sure if this is a good idea..
       task.app = self;
       task.log = self.logger.getLogger('app.task');

       assert(is.string(task.name), 'Invalid Task: Missing exports.name');
       assert(is.fn(task.run),      'Invalid Task: Missing exports.run()');

       self.task.define(task.name, task.options || {}, task.run);
       found.push(task.name);
  });

  this.log.info('Loaded tasks:   ' + cyan('%s'), found.join(', '));

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

    // Log started servers
    self.pack._servers.forEach(function(s) {
      var info = s.info.uri;
      if(s.settings && Array.isArray(s.settings.labels)) {
        info = cyan(info) + ' (' + utils.chalk.magenta(s.settings.labels.join(', ')) + ')';
      }
      self.log.info('Started web server: ' + info);
    });

    // Start task scheduler
    if(self.task) {
      var tLog = self.logger.getLogger('app.task');

      // Purge old tasks without definitions
      self.task.purge(function(err, num) {
        if(err) tLog.err(err);
        if(num) tLog.info('Purged %i old jobs', cyan(num));
      });

      // Start scheduler after 1-10 seconds
      // So all servers don't run at the same time
      setTimeout(function() {
        self.task.start.bind(self.task);
        self.log.info('Started task scheduler');
      }, utils.random(1000, 10000));

    }

    if(callback) return callback();
    else return this;
  });
};


//
// Stop all servers
//
Nails.prototype.stop = function stopServers(options, callback) {
  var self = this;

  if(typeof options === 'function') {
    callback = options;
    options = {};
  }

  options = defaults({
    timeout: 30 * 1000
  }, options);

  if(this.task) {
    this.task.stop();
    this.log.info('Stopped task scheduler');
  }

  this.pack.stop(options, function() {
    self.log.info('Stopped all servers');
    if(callback) return callback();
    else return self;
  });
};


//
// createApplication - Returns a new Nails instance
//
module.exports = function createApplication(options) {
  return new Nails(options);
};

exports.utils = utils;
