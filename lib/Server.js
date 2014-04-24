var util  = require('util');
var utils = require('nails-utils');

//
// ## Factory
//
module.exports = function serverFactory(app) {
  return createServer.bind(app);
};

function createServer(host, port, options) {
  var server = this.pack.server.apply(this.pack, arguments);

  // server.on('log',      logEvent.bind(this));
  // server.on('request',  logRequest.bind(this));
  // server.on('response', logResponse.bind(this));

  return server;
}


// function logEvent(event, tags) {
//   var level = 'info';
//   if (tags.debug) level = 'debug';
//   if (tags.info)  level = 'info';
//   if (tags.warn)  level = 'warn';
//   if (tags.error) level = 'error';
//
//   this.log[level](util.format(event.data));
// }
//
// function logRequest(request, event, tags) {
//   if (tags.error && util.isError(event.data)) {
//     var err = event.data;
//
//     if (err.isBoom && err.output.statusCode < 500) {
//       this.log.warn(
//         utils.chalk.yellow.bold('%d') + utils.chalk.bold(' %s ') + utils.chalk.red('%s'),
//         err.output.statusCode,
//         request.method.toUpperCase(),
//         err.message
//       );
//     }
//     else {
//       this.log.error(utils.chalk.red('%s'), err);
//     }
//   }
// }
//
// function logResponse(request) {
//   var now = new Date();
//
//   var access = {
//     ip            : request.info.remoteAddress,
//     time          : now,
//     method        : request.method.toUpperCase(),
//     url           : request.url.path,
//     agent         : request.headers['user-agent'],
//     referer       : request.headers.referer || request.headers.referrer || '-',
//     http_ver      : request.raw.req.httpVersion,
//     length        : request.response.headers['content-length'],
//     status        : request.response.statusCode,
//     color         : 'green',
//     response_time : now.getTime() - request.info.received
//   };
//
//   if      (access.status >= 500) access.color = 'red';
//   else if (access.status >= 400) access.color = 'yellow';
//   else if (access.status >= 300) access.color = 'cyan';
//
//   this.log.info(
//     utils.chalk[access.color].bold('%d') + utils.chalk.bold(' %s ') + utils.chalk.grey('%s') + utils.chalk.magenta(' (%s, %dms)'),
//     access.status,
//     access.method,
//     access.url,
//     access.ip,
//     access.response_time
//   );
// }
