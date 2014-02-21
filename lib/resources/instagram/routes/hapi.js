module.exports = function() {
  var self = this;
  var joi = require('joi');

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
    tags: ['api', 'instagram', 'receive']
  };

  return routes;
};
