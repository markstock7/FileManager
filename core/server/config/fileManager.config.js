var path = require('path'),
    localCloudSettings;

// 本地云设置 ,bucket由服务器定义
localCloudSettings = {

    // 域
    domain: 'http://localhost:3001/',

    // 网站的根路径
    rootPath: path.join(path.resolve(), 'localCloudStore'),

    // 允许返回的文件格式
    // 如果为空则返回所有文件
    extensionWhiteList: [
        // 'jpg',
        // 'jpeg',
        // 'png',
        // 'txt',
        // 'c'
    ],

    // 文件最大上传大小， 默认为5MB
    maxUploadSize: 5 * 1024 * 1024,

    // 定义bucket
    buckets: [{
        path: '/Bucket1', //相对于网站根目录的路径
        name: 'bucket1'
    }, {
        path: '/Bucket2',
        name: 'bucket2',
    }, {
        path: '/Bucket3',
        name: 'bucket3'
    }],

    // 是否显示隐藏文件
    showHidden: false,

    // 文件权限
    mode: '0755',

    // 目录删除模式
    // strict  强制删除模式  尝试递归删除
    // normal  普通删除模式  调用rmdir
    deleteMode: 'strict' // 强行删除模式，调用系统命令
}

module.exports = {localCloudSettings: localCloudSettings};
