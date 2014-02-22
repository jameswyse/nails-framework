var utils = require('../../utils');

module.exports = function(mongoose) {

  /**
   * Paginates and executes a query
   */
  mongoose.Query.prototype.paginate = function paginate(page, limit, callback) {

    // The number of pages to show
    page  = parseInt(page, 10) || 1;
    limit = parseInt(limit, 10) || 20;

    if(page  < 1) page = 1;
    if(limit < 1) limit = 1;

    var skip  = (page * limit) - limit;
    var query = this.skip(skip).limit(limit);

    if(!callback) return query;

    query.exec(function(fErr, result) {
      if(fErr) return callback(fErr, null, null);

      query.model.count(query._conditions).exec(function(cErr, count) {
        if(cErr) return callback(cErr, null, null);
        var totalPages = Math.ceil(count / limit);

        var info = {
          enabled: count > limit,
          items: {
            total: count,
            remaining: limit < count ? count - limit : 0,
            limit: limit
          },
          pages: {
            current: page,
            total: totalPages || 1,
            prev: page > 1 && page <= totalPages ? page - 1 : null,
            next: page < totalPages ? page + 1 : null,
            first: 1,
            last: totalPages
          }
        };

        return callback(null, result, info);
      });
    });
  };

};
