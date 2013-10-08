var Registry = function(Constructor) {
  this.Item = Constructor;
  this.items = {};
};

Registry.prototype.define = function(definition) {
  return new this.Item(definition);
};

Registry.prototype.register = function(name, definition) {
  if(!(definition instanceof this.Item)) {
    definition = new this.Item(definition);
  }

  this.items[name] = definition;
};

Registry.prototype.update = Registry.prototype.register;

Registry.prototype.list = function() {
  return this.items;
};

Registry.prototype.keys = function() {
  return Object.keys(this.items);
};

Registry.prototype.values = function() {
  return Object.keys(this.items)
    .map(function(key) {
      return this.items[key];
    }
  );
};

Registry.prototype.get = function(name) {
  return this.items[name];
};

Registry.prototype.remove = function(name) {
  delete this.items[name];
};

module.exports = Registry;
