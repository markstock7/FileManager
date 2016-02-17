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

            mvObject: {
                method: 'POST',
                endpoint: '/api/localCloud/object'
            }

            // uploadObjects: '/api/cloud/local/uploadObjects'

        }],

        //
        Title: 'Great File Manager',
        debug: true
    });
});
