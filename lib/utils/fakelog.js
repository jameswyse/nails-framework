module.exports = function fakeLog() {

  var Dummy = function() {
    this.logs = [];
  };

  Dummy.prototype.getLogs = function() {
    return this.logs;
  };

  ['trace', 'verbose', 'debug', 'info', 'warn', 'error', 'critical'].forEach(function(level) {
    Dummy.prototype[level] = function() {
      this.logs.push({
        level: level,
        args: arguments
      });
    };
  });

  return new Dummy();
};
