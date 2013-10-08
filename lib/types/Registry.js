var Registry = function(Constructor) {
  this.Item = Constructor;
  this.items = {};
};

Registry.prototype.construct = function(constructor, args) {
  function F() {
    return constructor.apply(this, args);
  }
  F.prototype = constructor.prototype;
  return new F();
};

Registry.prototype.define = function(definition) {
  return this.construct(this.Item, Array.prototype.slice.call(arguments));
};

Registry.prototype.register = function(name, definition) {
  if(!(definition instanceof this.Item)) {
    definition = this.define.apply(this, Array.prototype.slice.call(arguments, 1));
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
