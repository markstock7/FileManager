#Usage
  打开core/server/config/fileManager.config.js 可以进行bucket配置，容器根目录设置

  默认的容器为根目录下localCloudStore

  bower install

  npm install

  npm start

  然后在浏览器中打开http://localhost:3001/

#TODO
  图片显示接口，可以让文件中的图片直接显示

  文件下载接口

  文件上传接口

  文件拖拽复制移动正在处理中
#Service 配置
前台通过service和后端相应的api进行交互，每个service接口都应该遵循相应的规格，查看 <<服务器端接口配置>>

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

            listBuckets: {
                method: 'GET',
                endpoint: '',
            },

            listFolders: {
                method: 'GET',
                endpoint: '',
            },

            listObjects: {
                method: 'GET',
                endpoint: '',
            },

            createFolder: {
                method: 'POST',
                endpoint: ''
            },

            deleteObject: {
                method: 'DELETE',
                endpoint: ''
            },

            reNameObject: {
                method: 'PUT',
                endpoint: ''
            },

            mvObject: {
                method: 'POST',
                endpoint: '/api/localCloud/object'
            }
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
