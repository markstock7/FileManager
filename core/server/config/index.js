var _ = require('lodash'),
    config = {};
// value key
_.each(['fileManager.config', 'aliyuOss.config'], function(c) {
    _.extend(config, require('./' + c));
});


module.exports = config;
