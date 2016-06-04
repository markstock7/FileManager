var aliyunOss = require('../models/aliyunOss.model'),
    Promise = require('bluebird'),
    pipeline = require('../utils/pipeline'),
    aliyunOssController;

aliyunOssController = {
    listBuckets: function listBuckets(options) {
        function doTask(options) {
            return aliyunOss.listBuckets(options);
        }
        // can add more function into pipeline
        return pipeline([doTask], options).then(function(buckets) {
            return {
                buckets: buckets,
                count: buckets.length
            }
        });
    },
    listObjects: function listObjects(options) {
        function doTask(options) {
            return aliyunOss.listObjects(options);
        }

        return pipeline([doTask], options).then(function(objects) {
            return objects;
        });
    },
};
module.exports = aliyunOssController;
