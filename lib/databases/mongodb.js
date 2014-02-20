module.exports = function(conf) {
  var log      = this.logger.getLogger('app.db');
  var cyan     = this.utils.chalk.cyan;
  var red      = this.utils.chalk.red;
  var resolve  = this.utils.path.resolve;
  var mongoose;

  try {
    mongoose = require(resolve(this.base, 'node_modules', 'mongoose'));
  } catch(e) {
    log.error(red('Install mongoose with \'npm install --save mongoose\''));
    throw e;
  }


  //
  // Formats a mongodb connection string from the db object.
  //
  function getURL(db) {
    return [
      'mongodb://',
      db.serverConfig.host,
      ':',
      db.serverConfig.port,
      '/',
      db.databaseName
    ].join('');
  }

  //
  // Constructor
  //
  var MongoDB = function(url, options) {
    // Connect and store connection
    this.db    = mongoose.createConnection(url, options || {});

    // Bind model() for easy access
    this.model = this.db.model.bind(this.db);

    // Event: Connected
    this.db.on('open', function() {
      this.url = getURL(this.db);
      log.info('Connected to MongoDB: %s', cyan(this.url));
    });

    // Event: Disconnected
    this.db.on('close', function() {
      log.warn('Disconnected from MongoDB: %s', cyan(this.url));
    });

    // Event: Error
    this.db.on('error', function(err) {
      log.error(err);
    });
  };

  MongoDB.prototype.log    = log;
  MongoDB.prototype.Schema = mongoose.Schema;
  MongoDB.prototype.Types  = mongoose.Types;
  MongoDB.prototype.mongo  = mongoose.mongo;

  return new MongoDB(conf.url, conf.options);
};
