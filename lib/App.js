// Module Dependencies
var Hapi         = require('hapi');
var Registry     = require('rego');
var request      = require('request');
var EventEmitter = require('events').EventEmitter;
var utils        = require('nails-utils');
var config       = require('./Config');
var server       = require('./Server');
var LogBuffer    = require('./LogBuffer');

// Define Internals
var internals = {};

// Default options
internals.defaults = {
  name:    'app',
  desc:    'Application',
  version: '0.0.0',
  env:     process.env.NODE_ENV ? process.env.NODE_ENV.toLowerCase() : 'development',
  base:    process.cwd(),
  require: require,
  options: {
    configure: true,
    cache:  {
      engine:    'catbox-memory',
      partition: 'app'
    }
  }
};

// Event List
internals.events = [
  'configure',
  'configured',
  'boot',
  'booted',
  'servers-started',
  'servers-stopped',
  'start',
  'started',
  'stop',
  'stopped',
  'plugins-registered',
  'hapi-plugins-registered',
  'logger-registered'
];

// Hook List
internals.hooks = [
  'configure',
  'boot',
  'start',
  'stop'
];


//
// App Constructor
//
var App = module.exports = function(opts) {
  opts = utils.defaults(internals.defaults, opts || {});

  // Set Properties
  this.name         = opts.name;
  this.desc         = opts.desc;
  this.version      = opts.version;
  this.base         = opts.base;
  this.env          = opts.env;
  this.requireFn    = opts.require;
  this.options      = opts.options;

  // Plugin Storage
  this._plugins     = [];
  this._hapiPlugins = [];

  // Event & Hook Storage
  this._events = internals.events;
  this._hooks  = {};

  internals.hooks.forEach(function(hook) {
    this._hooks[hook] = [];
  }, this);

  // Auto Configuration
  this._configured  = false;

  if(this.options.configure) {
    this.configure(this.options);
  }
};

utils.inherits(App, EventEmitter);

//
// Prototype Methods
//
App.prototype.Hapi      = Hapi;
App.prototype.Registry  = Registry;
App.prototype.Promise   = utils.Promise;
App.prototype.utils     = utils;
App.prototype.service   = new Registry('Service');
App.prototype.log       = new LogBuffer();


//
// Configure the application
//
App.prototype.configure = function configure(opts, callback) {
  var self = this;

  this.emit('configure');

  // Check arguments
  if(utils.is.fn(opts)) {
    callback = opts;
    opts = {};
  }

  // Callback is optional
  if(!utils.is.fn(callback)) callback = utils.noop;

  // Opts defaults to this.options
  opts = utils.defaults(this.options, opts);

  // Grab hooks to run before configuring
  var hooks = this._hooks.configure;

  // Define tasks
  var tasks = [
    configureConfig,
    configureCache,
    configurePack,
    configureServers,
    configureServices,
    configurePlugins,
    configureHapiPlugins,
    emitComplete
  ].map(function(task) { return task.bind(self); });

  // Run all tasks and callback
  utils.async.series(hooks.concat(tasks), callback);

  function emitComplete(next) {
    this._configured = true;
    this.emit('configured');

    next();
  }

  // Configure app.config
  function configureConfig(next) {
    this.config = config(this);
    this.loadConfig();

    next();
  }

  function configureCache(next) {
    if(utils.is.string(opts.cache)) {
      opts.cache = this.config.get(opts.cache, { env: this.env });
    }

    if(opts.cache && utils.is.string(opts.cache.engine)) {
      var Engine = this.requireFn(opts.cache.engine);
      opts.cache.engine = new Engine();
    }

    next();
  }

  function configurePack(next) {
    this.pack = new Hapi.Pack({
      app:   this,
      cache: opts.cache
    });

    next();
  }

  function configureServers(next) {
    var self = this;

    this.server = server(this);

    if(!opts.servers) return next();

    if(utils.is.string(opts.servers)) {
      opts.servers = this.config.get(opts.servers, { env: this.env });
    }

    opts.servers.forEach(function(srv) {
      var host = '0.0.0.0';
      var port = 3000;
      var opts = {};

      if(utils.is.object(srv)) {
        sHost = srv.host    || host;
        sPort = srv.port    || port;
        sOpts = srv.options || opts;
      }

      else if(utils.is.number(srv)) {
        sPort = srv;
      }

      self.server(sHost, sPort, sOpts);
    });

    next();
  }

  function configureServices(next) {
    this.service.register('request', request);

    next();
  }

  function configurePlugins(next) {
    var self = this;

    if(!opts.plugins) return next();

    if(utils.is.string(opts.plugins)) {
      opts.plugins = this.config.get(opts.plugins, { env: this.env });
    }

    opts.plugins.forEach(function(plug) {
      if(utils.is.object(plug)) {
        self.plugin(plug.name, plug.options || {});
      }
      else if(utils.is.string(plug) || utils.is.fn(plug)) {
        self.plugin(plug);
      }
    });

    next();
  }

  function configureHapiPlugins(next) {
    if(opts.use) {
      opts.load = opts.use;
      delete opts.use;
    }

    if(opts.partials) {
      opts.load = opts.partials;
      delete opts.partials;
    }

    if(!opts.load) return next();

    if(utils.is.string(opts.load)) {
      opts.load = self.config.get(opts.load, { env: this.env });
    }

    opts.load.forEach(function(hPlug) {
      this.load(hPlug);
    }, this);

    next();
  }
};


//
// Add A Hook
//
App.prototype.hook = function before(event, fns) {
  var self = this;

  if(!utils.is.array(fns)) fns = [fns];

  fns = fns.map(function(fn) {
    return fn.bind(self);
  });

  this._hooks[event] = this._hooks[event].concat(fns);
};


//
// Boot Application
//
App.prototype.boot = function bootApp(callback) {
  var self = this;

  this.emit('boot');

  if(!utils.is.fn(callback)) callback = utils.noop;

  var hooks = this._hooks.boot;

  var tasks = [
    this.registerPlugins,
    this.registerLogger,
    this.registerHapiPlugins,
    emitComplete
  ].map(function(task) { return task.bind(self); });

  // Run all tasks and callback
  utils.async.series(hooks.concat(tasks), callback);

  function emitComplete(next) {
    this.emit('booted');
    next();
  }
};


//
// Start Application
//
App.prototype.start = function startApp(callback) {
  var self = this;

  // Emit 'starting' event
  this.emit('start');

  // Callback is optional
  if(!utils.is.fn(callback)) callback = utils.noop;

  var hooks = this._hooks.start;

  var tasks = [
    this.boot,
    this.startServers,
    emitComplete
  ]

  // Configure the application first, if not already configured.
  if(!this._configured) {
    tasks.unshift(this.configure.bind(this, this.options));
  }

  tasks = tasks.map(function(task) { return task.bind(self); });

  // Run all tasks and callback
  utils.async.series(hooks.concat(tasks), callback);

  function emitComplete(next) {
    this.emit('started');
    next();
  }
};


//
// Stop Application
//
App.prototype.stop = function stopApp(callback) {
  var self = this;

  this.emit('stop');

  var hooks = this._hooks.stop;

  var tasks = [
    this.stopServers
    emitComplete
  ].map(function(task) { return task.bind(self); });

  function emitComplete(next) {
    this.emit('stopped');
    next();
  }

  utils.async.series(tasks.concat(hooks), callback);
};


//
// Load a plugin
//
App.prototype.plugin = function loadPlugin(name, options) {
  var is = utils.is;
  var plugin;

  utils.assert(is.string(name) || is.object(name) || is.fn(name), 'Invalid Plugin');

  if(is.object(name) || is.fn(name)) plugin = name;
  else plugin = this.requireFn(name);

  utils.assert(is.string(plugin.name), 'Plugin name is missing');
  utils.assert(is.string(plugin.type), 'Plugin type is missing');
  utils.assert(is.fn(plugin.register), 'Plugin register function is missing');

  if(is.string(options)) {
    options = this.config.get(options, { env: this.env }) || {};
  }

  plugin.options = options || {};
  this._plugins.push(plugin);

  return this;
};


//
// Load a Hapi plugin
//
App.prototype.load = function loadHapiPlugin(pattern, options) {
  utils.assert(utils.is.string(pattern), 'Missing glob pattern');
  options = options || {};

  var self  = this;

  utils.finder({
    pattern: pattern,
    cwd: this.base
  }, function(file, total) {
      var plugin = require(file);
      var single = total === 1;

      utils.assert(utils.is.string(plugin.name),     'Invalid Hapi Plugin: Missing exports.name');
      utils.assert(utils.is.defined(plugin.version), 'Invalid Hapi Plugin: Missing exports.version');
      utils.assert(utils.is.fn(plugin.register),     'Invalid Hapi Plugin: Missing exports.register()');

      // Register
      self._hapiPlugins.push({
        plugin: plugin,
        options: single ? options : options[plugin.name] || options || {}
      });
  });

  return this;
};

App.prototype.partial = App.prototype.load;
App.prototype.use     = App.prototype.load;


//
// Register all loaded plugins
//
App.prototype.registerPlugins = function registerPlugins(callback) {
  var self = this;

  function applyPlugin(plugin, next) {
    plugin.register(self, plugin.options, function(err) {
      if(err) return next(err);

      plugin.registered = true;
      return next();
    });
  }

  utils.async.eachSeries(this._plugins, applyPlugin, function(err) {
    if(err) return callback(err);
    self.emit('plugins-registered');
    return callback();
  });
};


//
// Register all Hapi plugins
//
App.prototype.registerHapiPlugins = function registerHapiPlugins(callback) {
  var self = this;

  // this.pack._settings.requirePath = utils.path.resolve(this.base, 'node_modules');

  function applyPlugin(plugin, next) {
    self.pack.register(plugin.plugin, plugin.options || {}, function(err) {
      if(err) return next(err);
      else    return next();
    });
  }

  utils.async.eachSeries(this._hapiPlugins, applyPlugin, function(err) {
    if(err) return callback(err);
    self.emit('hapi-plugins-registered');
    return callback();
  });
};


//
// Start all servers
//
App.prototype.startServers = function startServers(callback) {
  var self = this;

  this.pack.start(function() {

    // Log started servers
    self.pack._servers.forEach(function(s) {
      var info = s.info.uri;
      if(s.settings && Array.isArray(s.settings.labels) && s.settings.labels.length) {
        info += ' (' + s.settings.labels.join(', ') + ')';
      }
      self.log(['info'], 'Started web server: ' + info);
    });

    self.emit('servers-started');
    return callback ? callback() : self;
  });
};


//
// Stop all servers
//
App.prototype.stopServers = function stopServers(callback) {
  var self = this;

  var options = {
    timeout: 30 * 1000
  };

  this.pack.stop(options, function() {
    self.log(['info'], 'Stopped all servers');
    self.emit('servers-stopped');
    if(callback) return callback();
    else return self;
  });
};


//
// Load configuartion
//
App.prototype.loadConfig = function loadConfig() {
  var c = this.options.config;

  if(!utils.is.object(c)) return;

  if(c.env)   this.config.env(c.env);
  if(c.argv)  this.config.argv(c.argv);
  if(c.pkg)   this.config.pkg(c.argv);
  if(c.file)  this.config.file(c.file);
  if(c.files) this.config.file(c.files);
};


//
// Enable the logger
//
App.prototype.registerLogger = function enableLogger(next) {
  var self = this;

  if(utils.is.string(this.options.logs)) {
    this.options.logs = this.config.get(this.options.logs, { env: this.env });
  }

  // Register logger
  this.pack.require('good', this.options.logs || {}, function(err) {
    if(err) return next(err);

    // Get buffered events
    var bufferedLogs;
    if(utils.is.fn(self.log.getLogs)) {
      bufferedLogs = self.log.getLogs();
    }

    // Replace app.log with the Hapi logger
    self.log = self.pack.log.bind(self.pack);

    // Output any buffered events
    if(bufferedLogs) {
      bufferedLogs.forEach(function(event) {
        self.log.apply(self.log, event);
      });
    }

    self.emit('logger-registered');
    return next();
  });
};
