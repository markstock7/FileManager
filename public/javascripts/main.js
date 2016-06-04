$(function() {
    window.fileManager = $('#fileManager').fileManager({

        //配置服务
        Service: [{
            // 本地服务
            serviceName: 'local',
            server: 'http://localhost:3001',

            listBuckets: {
                method: 'GET',
                endpoint: '/api/localCloud/buckets'
            },

            listFolders: {
                method: 'GET',
                endpoint: '/api/localCloud/folders'
            },

            listObjects: {
                method: 'GET',
                endpoint: '/api/localCloud/objects'
            },

            createFolder: {
                method: 'POST',
                endpoint: '/api/localCloud/folders'
                // post newFolderName
            },

            // keys的删除均以队列的形式一一删除，
            deleteObject: {
                method: 'DELETE',
                endpoint: '/api/localCloud/object'
                // post deleteObjects;
            },
            reNameObject: {
                method: 'PUT',
                endpoint: '/api/localCloud/object'
            },

            moveObject: {
                method: 'POST',
                endpoint: '/api/localCloud/object'
            },

            createObject: {
                method: 'POST',
                endpoint: '/api/localCloud/file'
            },
            downloadObject: {
              method: 'GET',
              endpoint: '/api/localCloud/object'
            }

        }, {
          serviceName: '阿里云OSS',
          server: 'http://localhost:3001',
          listBuckets: {
              method: 'GET',
              endpoint: '/api/aliyunOss/buckets'
          },
          listObjects: {
              method: 'GET',
              endpoint: '/api/aliyunOss/objects'
          }
        }],

        //
        Title: 'Great File Manager',
        debug: true
    });
});
