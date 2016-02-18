var localCloud = require('../controllers/localCloud.controller'),
    multer = require('multer'),
    upload = multer({dest: 'uploads/'}),
    apiHeader = require('../utils/header');

module.exports = function(router) {
    // create router here
    router.get('/api/localCloud/buckets', apiHeader.http(localCloud.listBuckets));
    router.get('/api/localCloud/folders', apiHeader.http(localCloud.listFolders));
    router.get('/api/localCloud/objects', apiHeader.http(localCloud.listObjects));

    // 创建新目录
    router.post('/api/localCloud/folders', apiHeader.http(localCloud.addFolder));

    // 删除文件或目录
    router.delete('/api/localCloud/object', apiHeader.http(localCloud.deleteObject));

    // 重命名 文件或目录
    router.put('/api/localCloud/object', apiHeader.http(localCloud.reNameObject));

    // 文件移动
    // toKey 必须为目录
    // fromkey
    router.post('/api/localCloud/object', apiHeader.http(localCloud.mvObject));

    router.post('/api/localCloud/file',upload.single('file'), apiHeader.http(localCloud.uploadFile))
};
