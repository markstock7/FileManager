
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

#服务器端接口配置

####createFolder 创建目录
    
    请求方法: Post
    Request Body: {
    	bucket:		
    	key:
		Addition:[]		
		newFolderName:
    }
    
    返回结果: {
    	newFOlderKey: 新目录的key
    }


####reNameObject 修改objcet的名称(可以是文件夹，也可以是文件名)
    
    请求方法: PUT
    Request Body: {
    	bucket:  
    	key:  
    	fromName: 
    	toName:
    	Addition:[]
    }
    
    返回结果: {
    	newKey: 
    }
    
####deleteObject 删除objcet(可以是文件夹, 也可以是文件名) 
可以在服务器端设置删除模式，如果为strict则会强行删除目录，即便目录不为空(使用rimraf-promise模块)

如果为normal则调用fs.rmdir,如果目录不为空，则会报错

    请求方法: DELETE
    Request Body: {
        bucket: 
        key:
    }
    
    返回结果: 'ok'

####mvObject 移动Object
toKey 必须为目录，
fromKey 可以为文件也可以为目录
    
    请求方法: POST 
    Request Body: {
    	bucket: 
    	fromKey:
    	toKey
    }
    
    返回结果 {
        toNewKey: // 新的fromKey
    }
    