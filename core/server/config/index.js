var _ = require('lodash'),
    config = {};
// value key
_.each(['fileManager.config'], function(c) {
    _.extend(config, require('./' + c));
});

module.exports = config;
