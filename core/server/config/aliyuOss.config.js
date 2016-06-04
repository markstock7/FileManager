var path = require('path'),
    ALY  = require('aliyun-sdk'),
    ALYAccount = require('./aliyunAccount'),
    aliyunOssSetting = [];

if (!ALYAccount) {
  console.error('please set aliyun Account information');
  process.exit(-1);
}

if (!ALYAccount.endpoint || ALYAccount.endpoint.length <= 0) {
  console.error('endpoint can not be empty');
}

for (var i = 0; i < ALYAccount.endpoint.length ; i++ ){
  aliyunOssSetting[ALYAccount.endpoint[i]] = new ALY.OSS({
    accessKeyId: ALYAccount.accessKeyId,
    secretAccessKey: ALYAccount.secretAccessKey,
    securityToken: '',
    endpoint: ALYAccount.endpoint[i],
    apiVersion: '2013-10-15'
  });
}

module.exports = { aliyunOssSetting: aliyunOssSetting };
