var localCloud = require('../controllers/localCloud.controller'),
    apiHeader = require('../utils/header');

module.exports = function(router) {
    // create router here
    router.get('/api/localCloud/buckets', apiHeader.http(localCloud.listBuckets));
    router.get('/api/localCloud/folders', apiHeader.http(localCloud.listFolders));
    router.get('/api/localCloud/objects', apiHeader.http(localCloud.listObjects));
    router.post('/api/localCloud/folders', apiHeader.http(localCloud.addFolder));

    // router.delete('/api/localCloud/object', apiHeader.http(localCloud.deleteObject));
    router.delete('/api/localCloud/objects', apiHeader.http(localCloud.deleteObjects));
    // router.post('/api/localCloud/folders', localCloud.createFolders);
};
