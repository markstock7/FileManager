
#Service 配置
    # HTML
    <div class="fileManager"></div>

    # Javascript
    fileManager = $('#fileManager').fileManager({

        //配置服务
        Service: [{
            
            // 服务名称
            serviceName: 'local',

            // 服务的域
            server: 'http://localhost:3000',

            listFolders: {
                method: 'GET',
                endpoint: '',
            },

            // 获取文件
            getObjects: {
                method: 'GET',
                endpoint: '',
            },

            // 获取buckets
            getBuckets: {
                method: 'GET',
                endpoint: '',
            },

            // 删除bucket
            deleteBucket: {
                method: 'DELETE',
                endpoint: '',
            },

            // 删除(多个)文件
            deleteObjects: {
                method: 'DELETE',
                endpoint: '',
            },

            // 移动文件
            moveObject: {
                method: 'POST',
                endpoint: '',
            },

            // 创建目录
            createFolder: {
                method: 'POST',
                endpoint: '',
            },

            // 创建文件
            createObject: {
                method: 'POST',
                endpoint: '',
            },

            // 重命名一个文件
            renameObject: {
                method: 'PUT',
                endpoint: ''
            },


        }],

        //
        Title: 'Greate Media',
    });