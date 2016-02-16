var localCloudModel = require('../models/localCloud.model'),
    Promise = require('bluebird'),
    pipeline = require('../utils/pipeline'),
    localCloudController;

localCloudController = {
    listBuckets: function listBuckets(options) {
        function doTask(options) {
            return localCloudModel.listBuckets(options);
        }
        // can add more function into pipeline
        return pipeline([doTask], options).then(function(buckets) {
            return {
                buckets: buckets,
                count: buckets.length
            }
        });
    },

    listFolders: function listFolders(options) {
        function doTask(options) {
            return localCloudModel.listFolders(options);
        }
        return pipeline([doTask], options).then(function(folders){
            return {
                folders: folders,
                count: folders.length
            }
        });
    },

    listObjects: function listObjects(options) {
        function doTask(options) {
            return localCloudModel.listObjects(options);
        }

        return pipeline([doTask], options).then(function(objects) {
            return objects;
        });
    },

    addFolder: function addFolder(object, options) {
        function doTask(object, options) {
            return localCloudModel.addFolder(object, options);
        }

        return pipeline([doTask], object, options).then(function() {
            return 'ok';
        });
    }


};
module.exports = localCloudController;
