module.exports = function finder(options, callback) {
  var is      = this.is;
  var string  = this.string;
  var assert  = this.assert;
  var glob    = this.glob.sync;
  var resolve = this.path.resolve;

  if(is.string(options)) {
    options = { pattern: options };
  }

  assert(is.object(options), 'Missing options');
  options.cwd = options.cwd || process.cwd();

  var files;
  var S = string(options.pattern);

  if(S.contains('*')) {
    files = glob(options.pattern, {
      cwd: options.cwd,
      mark: true
    });
  }
  else files = [resolve(options.cwd, options.pattern)];

  assert(!is.array.empty(files), 'No files were found');

  files.forEach(function(file) {
    callback(resolve(options.cwd, file), files.length);
  });

  return files;
};
