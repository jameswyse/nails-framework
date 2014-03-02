module.exports = function() {
  var self  = this;
  var utils = require('nails-utils');
  var joi   = utils.joi;

  var routes = {};

  //
  // Status
  //
  routes.status = {
    description: 'Shows the current status of instagram subscriptions.',
    tags: ['api', 'instagram', 'status'],
    handler: {
      proxy: {
        uri: this.url('subscriptions', true)
      }
    }
  };


  //
  // Handshake
  //
  routes.handshake = {
    description: 'Called by instagram to verify a new subscription',
    notes: 'Reponds with the value of query.hub.challenge',
    tags: ['api', 'instagram', 'handshake'],
    validate: {
      query: {
        'hub.mode': joi.string().required().valid('subscribe'),
        'hub.verify_token': joi.string().required().valid(self.options.verify_token),
        'hub.challenge': joi.string().required().min(1)
      }
    },
    handler: function(request, reply) {
      reply(request.query['hub.challenge']);
    }
  };


  //
  // Receive
  //
  routes.receive = {
    description: 'Receives subscription updates from instagram',
    notes: [
      'Instagram will spam this endpoint every time a photo is tagged',
      'but doesn\'t include the actual post data so we get that manually.',
      'Since instagram only allow 5000 api requests per hour we can\'t request posts every time this is called.',
      'Minimum wait = 60 / (5000 / 3600) = 43 seconds'
    ],
    tags: ['api', 'instagram', 'receive']
  };

  return routes;
};
