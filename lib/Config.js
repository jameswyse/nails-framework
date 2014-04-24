//
// # Config.js
//

//
// ## Module Dependencies
//
var confidence = require('confidence');
var parseArgs  = require('minimist');
var utils      = require('nails-utils');

//
// ## Factory
//
module.exports = function configFactory(app) {
  return new Config(app);
};


//
// ## Constructor
//
var Config = function(app) {
  this.base  = app.base || process.cwd();
  this.log   = app.log;
  this.store = new confidence.Store();
};


//
// ##Config#get
//
Config.prototype.get = function get() {
  return this.store.get.apply(this.store, arguments);
};


//
// ##Config#meta
//
Config.prototype.meta = function meta() {
  return this.store.meta.apply(this.store, arguments);
};


//
// ##Config#env
//
// *Loads configuration from ENV variables*
//
Config.prototype.env = function loadEnv(options) {
  if(utils.is.string(options)) options = { prefix: options };

  if(options === true) options = {};

  options = utils.defaults({
    as: 'env'
  }, options || {});

  if(options.key) options.as = options.key;

  var obj = this.store.get('/');
  var env = process.env;

  if(options.as) obj[options.as] = obj[options.as] || {};

  for (var i in env) {
    if (env.hasOwnProperty(i) && (!options.prefix || utils.string(i).startsWith(options.prefix))) {
      var name = i;

      if(options.prefix) {
        name = utils.string(name)
          .replaceAll(options.prefix, '')
          .toLowerCase()
          .camelize()
          .s;
      }

      if(options.as) obj[options.as][name] = env[i];
      else obj[name] = env[i];
    }
  }

  this.store.load(obj);

  return this;
};


//
// ##Config#argv
//
// *Loads configuration from argument variables*
//
Config.prototype.argv = function loadArgv(options) {
  if(utils.is.string(options)) options = { prefix: options };

  if(options === true) options = {};

  options = utils.defaults({
    as: 'argv'
  }, options || {});

  var obj = this.store.get('/');
  var argv = parseArgs(process.argv.slice(2), options);

  var insert = {};
  if(options.as) insert[options.as] = argv;
  else insert = argv;

  obj = utils.defaults(obj, insert);

  this.store.load(obj);

  return this;
};

//
// ##Config#pkg
//
// *Loads configuration from package.json*
//
Config.prototype.pkg = function loadPackage(options) {
  if(utils.is.string(options)) options = { prefix: options };

  if(options === true) options = {};

  options = utils.defaults({
    filename: utils.path.resolve(this.base, 'package.json'),
    as: 'pkg'
  }, options || {});

  if(utils.fs.existsSync(options.filename)) {
    var obj  = this.store.get('/');
    var pkg  = require(options.filename);

    if(options.prefix && pkg.hasOwnProperty(options.prefix)) {
      pkg = pkg[options.prefix];
    }

    var insert = {};
    if(options.as) insert[options.as] = pkg;
    else insert = pkg;

    obj = utils.defaults(obj, insert);
    this.store.load(obj);
  }
  else {
    this.log.warn('Could not load configuration from %s', utils.chalk.cyan(options.filename));
  }
  return this;
};

//
// ##Config#file
//
// *Loads configuration from files*
//
Config.prototype.file = function loadConfig(options) {
  var obj  = this.store.get('/');

  if(utils.is.string(options)) {
    options = { filename: options };
  };

  options.glob = options.glob || options.filename;

  if(!options.glob) {
    throw new Error('Invalid arguments: Missing filename or glob string');
  }

  utils.finder({
    pattern: options.glob,
    cwd: options.cwd || this.base
  }, function(file, total) {
      var ext  = utils.path.extname(file);
      var name = utils.path.basename(file, ext);

      obj[name] = require(file);
  });
  this.store.load(obj);

  return this;
};
