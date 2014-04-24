var LogBuffer = module.exports = function() {
    this.logs = [];
  };

LogBuffer.prototype.getLogs = function() {
  return this.logs;
};

LogBuffer.prototype.log = function() {
  this.logs.push(arguments);
};
