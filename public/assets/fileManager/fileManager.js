/*
 * jQuery lightweight plugin
 * Original author: @mark stock
 * Email: markstock7@hotmail.com
 * Github page: https://github.com/markstock7/fileManager
 * Licensed under the MIT license
 */
;(function($, _, document, window, undefined) {

    'use strict';

    var defaults = { Title: 'Great Media' },

        // 获取目录名称
        directoryNameRegexp = new RegExp(/\/?([^\/]+\/(?:\.[^\/]*)?$)/),

        // 验证是否为目录
        directoryRegexp = /\/([^\/]\/)?/g,

        // 获取文件的名称或后缀 或者目录的名称
        fileNameRegexp = new RegExp(/\/?(([^\/]+\/)?([^\/]*\.([^\/]*))*$)/),

        // 根据文件的节点获取其图标
        getIcon = (function getIcon() {
            //@TODO 支持更多的扩展名
            var iconMap = {
                    mp3: ['icon-mp3', 'large-icon-mp3'],
                    image: ['icon-image'],
                    txt: ['icon-txt', 'large-icon-txt'],
                    folder: ['icon-dir', 'large-icon-dir'],
                    zip: ['icon-zip', 'large-icon-zip']
                },
                // 扩展名规格化
                convertSuffix = function(suffix) {
                    switch (suffix) {
                        case 'jpg':
                        case 'png':
                        case 'jpeg':
                        case 'gif':
                            return 'image';

                        case 'bz2':
                        case 'tar':
                        case 'gz':
                            return 'zip';

                        default:
                            return 'txt';
                    }
                },
                icon;

            /**
             * @param suffix {string} 后缀名,
             * @param flag {boolean} true 为大图标, false 为小图标
             */
            return function(suffix, flag) {
                if (!suffix)
                    icon = iconMap.folder;
                else
                    icon = iconMap[convertSuffix(suffix)];
                if (flag)
                    return icon[1];
                else
                    return icon[0];
            };
        }()),

        /**
         * 获取文件的扩展名
         *
         * @param name {String} 文件名
         * @return {String} 文件的扩展名
         */
        getSuffix = function getSuffix(name) {
            var ret = fileNameRegexp.exec(name);
            if (ret.length > 1) {
                if (ret[3] === undefined) {
                    return '';
                } else {
                    return ret[4];
                }
            }
            return '';
        },

        // ID生成器
        generateId = (function generateId() {
            var _id = 1;
            return function() {
                return _id++;
            };
        }()),

        // 验证其是否为目录
        isFolder = function isFolder(key) {
            return directoryRegexp.test(key);
        },

        // 验证其是否为图片
        isImage = function isImage(suffix) {
            return /jpg|png|jpeg|gif/.test(suffix);
        },

        // 从key获取文件或文件夹的名称
        resolveKeyName = function resolveKeyName(key) {
            var ret = fileNameRegexp.exec(key);
            if (ret.length > 1) {
                if (ret[3] === undefined) {
                    return {
                        name: ret[2]
                    };
                } else
                    return {
                        name: ret[3],
                        suffix: ret[4]
                    };
            }
            return null;
        },

        // 格式化文件大小格式
        formatFileSize = function formatFileSize(size) {
            var unit = ['Byte', 'KB', 'MB', 'GB', 'TB'],
                i = 0,
                filesize;
            while (size >= 1024) {
                size = size / 1024;
                i++;
            }
            filesize = size + unit[i];
            return size.toFixed(0) + unit[i];
        },

        // 格式化时间格式
        formatDate = function formatDate(date, fmt) {
            if (typeof date === 'string')
                date = new Date(date);
            if (fmt === undefined)
                fmt = 'yyyy-MM-dd  hh:mm:ss';
            var o = {
                'y+': date.getFullYear(),
                'M+': date.getMonth() + 1,
                'd+': date.getDate(),
                'h+': date.getHours(),
                'm+': date.getMinutes(),
                's+': date.getSeconds(),
                'q+': Math.floor((date.getMonth() + 3) / 3),
                'S': date.getMilliseconds()
            };
            if (/(y+)/.test(fmt))
                fmt = fmt.replace(RegExp.$1, (date.getFullYear() + '').substr(4 - RegExp.$1.length));
            for (var k in o)
                if (new RegExp('(' + k + ')').test(fmt))
                    fmt = fmt.replace(RegExp.$1, (RegExp.$1.length == 1) ? (o[k]) : (('00' + o[k]).substr(('' + o[k]).length)));
            return fmt;
        },

        /**
         * 格式化错误信息
         * 默认接受两个格式的错误信息 一为字符串, 二为 {errors: [{message: ''}]}
         *
         * @param error {Object} 错误对象
         */
        formatError = function formatError(error) {
            if(typeof error === 'string')
                return error;
            else if($.isArray(error.errors) && error.errors.length && typeof error.errors[0].message === 'string') {
                return error.errors[0].message;
            } else {
                return 'Error';
            }
        },

        /**
         * @TODO
         */
        download = function download(file_name, src) {
            var aLink = document.createElement('a'),
                evt = document.createEvent('HTMLEvents');
            evt.initEvent('click', false, false);
            aLink.download = file_name;
            aLink.href = src;
            aLink.dispatchEvent(evt);
        },

        // 定义模版
        Template = {

            // 框架主体模版
            Main: $.templates('<div class="fManager" style="width:{{:Width}};height:{{:Height}}">' +
                '<div class="fManager-head clearfix">' +
                    '<a class="fManager-close"><span class="fm-icon close"></span></a>' +
                    '<h4 class="fManager-title">{{:Title}}</h4>' +
                '</div>' +
                '<div class="fManagerContent">' +
                    '<div class="fManagerSider">' +
                        '<ul class="ServiceList">' +
                        '</ul>' +
                    '</div>' +
                    '<div class="fManagerBody">' +
                        '<div class="fManagerBody-content">' +
                        '</div>' +
                        '<div class="fManagerBody-foot">' +
                            '<div class="tool">'+
                            '<div class="process-log">' +
                                '<span class="fm-icon log"></span>' +
                            '</div>' +
                            '<div class="upload-list">' +
                                '<span class="fm-icon upload-list"></span>' +
                            '</div>' +
                            '</div>'+
                        '</div>' +
                    '</div>' +
                '</div>' +
                '</div>'),
            ServiceList: $.templates('<li class="fnode-list" node-type="Service" id="flist-{{:__ID}}" data-fid="{{:__ID}}" > \
                              <div class="select-placeholder"></div> \
                              <span class="fnode-collapse"> \
                                <span class="oss-icon-s plus"></span> \
                              </span> \
                              <span class="fnode-icon"> \
                                  <span class="oss-icon server"></span> \
                              </span> \
                              <span class="fnode-name">{{:serviceName}}</span> \
                              <ul class="fnode-children"> \
                              </ul> \
                           </li>'),
            BucketList: $.templates('<li node-type="Bucket" class="fnode-list" id="flist-{{:__ID}}" data-fid="{{:__ID}}" > \
                            <div class="select-placeholder"></div> \
                            <span class="fnode-collapse"> \
                                <span class="oss-icon-s plus"></span> \
                            </span> \
                            <span class="fnode-icon"> \
                                <span class="oss-icon bucket"></span> \
                            </span> \
                            <span class="fnode-name">{{:Name}}</span> \
                            <ul class="fnode-children"> \
                            </ul> \
                        </li>'),
            FolderList: $.templates('<li node-type="Folder" class="fnode-list" id="flist-{{:__ID}}" data-fid="{{:__ID}}"> \
                            <div class="select-placeholder"></div> \
                            <div class="draggable-placeholder"></div> \
                            <span class="fnode-collapse"> \
                                <span class="oss-icon-s plus"></span> \
                            </span> \
                            <span class="fnode-icon"> \
                                <span class="oss-icon folder"></span> \
                            </span> \
                            <span class="fnode-name">{{:Name}}</span> \
                            <div node-type="edit-name" class="node-edit-name"> \
                                <input node-type="edit-name-box" class="box" type="text" value="{{:Name}}"> \
                            </div> \
                            <div class="nodeCreatebox" style="display:none"> \
                                <span class="fnode-icon"> \
                                    <span class="oss-icon folder"></span> \
                                </span> \
                                <input type="text" placeholder="新建文件夹" class="newNodeInput"> \
                            </div> \
                            <ul class="fnode-children"> \
                            </ul>\
                        </li>'),
            ModuleToolbar: $.templates('<div class="fM-module-toolbal"> \
                                <div class="fM-bar"> \
                                    <a class="toolbar-upload tool" href="javascript:void(0)"> \
                                        <input type="file" name="fm-upload-file" multiple="multiple" class="file-upload"> \
                                        <span class="fm-icon upload"></span> 上传文件 \
                                    </a> \
                                    <a class="toolbar-new-dir tool" href="javascript:void(0)"> \
                                        <span class="fm-icon createfile">新建文件夹</span> \
                                        <div class="new-dir-box"> \
                                            <input data-type="new-dir-box" class="box" type="text" placeholder="新文件夹名称"> \
                                            <span data-type="new-dir-sure" class="fm-icon fm-icon-sure sure"></span> \
                                            <span data-type="new-dir-cancel" class="fm-icon fm-icon-cancel cancel"></span> \
                                        </div> \
                                    </a> \
                                    <a class="toolbar-grid-view tool" href="javascript:void(0)"> \
                                        <span class="fm-icon grid"></span> \
                                    </a> \
                                    <a class="toolbar-list-view tool" href="javascript:void(0)"> \
                                        <span class="fm-icon list-selected"></span> \
                                    </a> \
                                </div> \
                            </div>'),
            ModuleCrumbs: $.templates('<div class="fM-module-curmbs"> \
                                <div class="crumbs-status"> \
                                    <span class="Loaded"></span> \
                                    <span class="LoadError" style="display:none">加载出错</span> \
                                    <span class="Loading" style="display:none">正在加载中...</span> \
                                </div> \
                                <div class="crumbs"> \
                                    <a class="crumb-item " data-path="/" href="javascript:void(0)">返回上一级 ｜</a> \
                                    <a class="crumb-item " data-path="/" data-bucket="0" href="javascript:void(0)">主页</a> \
                                </div> \
                            </div>'),
            CrumbsItem: $.templates('<a class="crumb-item" data-path="{{:PATH}}" href="javascript:void(0)">&nbsp;&gt;&nbsp;{{:NAME}}</a>'),
            CrumbsItemSpan: $.templates('<span class="crumb-item-span">&nbsp;&gt;&nbsp;{{:NAME}}</span>'),
            ModuleListView: $.templates('<div class="fM-module-list-view"> \
                                 <table class="list-view-table"> \
                                    <thead class="list-view-head"> \
                                        <tr class="list"> \
                                        <th class="col1"> \
                                            <span node-type="chkall" class="list-check list-checkall"> \
                                                <span class="fm-icon blank"></span> \
                                            </span> \
                                        </th>\
                                        <th class="col2">大小</th> \
                                        <th class="col3">修改日期</th> \
                                        </tr> \
                                    </thead> \
                                    <tbody class="list-view-content"> \
                                    </tbody>\
                                 </table> \
                              <div>'),
            ModuleListViewLi: $.templates('<tr class="list" data-suffix="{{:SUFFIX}}" data-address="{{:address}}" data-key="{{:KEY}}" data-name="{{:NAME}}"> \
                                    <th class="col1"> \
                                        <span class="list-check" node-type="chk"> \
                                            <span class="fm-icon blank"></span> \
                                        </span> \
                                        <span class="list-filename"> \
                                            <span class="list-icon object-icon {{:ICON}}"></span> \
                                            {{:NAME}} \
                                        </span> \
                                        <span class="list-action list-icon"> \
                                            <a data-key="share" class="action oss-icon share" href="javascript:void(0)"></a> \
                                            <a data-key="share" class="action oss-icon download" href="javascript:void(0)"></a> \
                                            <span class="action more-wrapper"> \
                                                <span node-type="btn-more" class="oss-icon more"></span> \
                                                <div node-type="more-list" class="more-list more-list-up" style="display: none;"> \
                                                    <a node-type="btn-item" data-key="move" class="more-item" href="javascript:void(0);">移动到</a> \
                                                    <a node-type="btn-item" data-key="copy" class="more-item" href="javascript:void(0);">复制到</a> \
                                                    <a node-type="btn-rename" class="more-item" href="javascript:void(0);">重命名</a> \
                                                    <a node-type="btn-item" data-key="delete" class="more-item" href="javascript:void(0);">删除</a> \
                                                </div> \
                                            </span> \
                                        </span> \
                                    </th> \
                                    <th class="col2">{{:FILE_SIZE}}</th> \
                                    <th class="col3">{{:FILE_MODIFIED}}</th> \
                               </tr>'),
            ModuleGridView: $.templates('<div class="fM-module-grid-view"> \
                                            <div class="grid-view-content"> \
                                            </div> \
                                        </div>'),
            ModuleGridViewBox_IMG: $.templates('<div class="grid" data-suffix="{{:SUFFIX}}" data-address="{{:address}}" data-key="{{:KEY}}" data-name="{{:NAME}}"> \
                                    <div class="thumb-large" title="{{:NAME}}" style="background:url({{:address}}) 50% 50% no-repeat;"> \
                                        <div class="grid-check" node-type="chk"> \
                                            <span class="fm-icon blank_b"></span> \
                                        </div> \
                                    </div> \
                                    <span class="grid-name">{{:NAME}}</span> \
                                    <div class="node-edit-name"> \
                                        <input data-type="node-edit-name" class="box" type="text" placeholder="新文件夹名称"> \
                                        <span data-type="node-edit-sure" class="fm-icon fm-icon-sure sure"></span> \
                                        <span data-type="node-edit-sure" class="fm-icon fm-icon-cancel cancel"></span> \
                                    </div> \
                                    </div>'),
            ModuleGridViewBox: $.templates('<div class="grid" data-suffix="{{:SUFFIX}}" data-address="{{:address}}" data-key="{{:KEY}}" data-name="{{:NAME}}"> \
                                    <div class="thumb-large object-large-icon {{:ICON}}" title="{{:NAME}}" > \
                                        <div class="grid-check" node-type="chk"> \
                                            <span class="fm-icon blank_b"></span> \
                                        </div> \
                                    </div> \
                                    <span class="grid-name">{{:NAME}}</span> \
                                    <div class="node-edit-name"> \
                                        <input data-type="node-edit-name" class="box" type="text" placeholder="新文件夹名称"> \
                                        <span data-type="node-edit-sure" class="fm-icon fm-icon-sure sure"></span> \
                                        <span data-type="node-edit-sure" class="fm-icon fm-icon-cancel cancel"></span> \
                                    </div> \
                                </div>'),
            ModuleContextMenu: $.templates('<div class="fM-module-context-menu"> \
                                    <ul class="menu-node"> \
                                        <li data-key="createnew">新建文件夹</li> \
                                        <li data-key="paste">复制到</li> \
                                        <li data-key="rename">重命名</li> \
                                        <li data-key="delete">删除</li> \
                                    </ul> \
                                    <ul class="service-node"> \
                                    </ul> \
                                    <ul class="grid-view-context"> \
                                        <li data-key="download">下载</li> \
                                        <li data-key="rename">重命名</li> \
                                        <li data-key="rename">复制到</li> \
                                        <li data-key="delete">移动到</li> \
                                        <li data-key="delete">删除</li> \
                                    </ul>  \
                                    <ul class="list-view-context"> \
                                    </ul> \
                                 </div>'),
            ModuleCheckAction: $.templates('<div class="fM-module-checkAction"> \
                                    <span class="text"> \
                                        已选中 <span node-type="num"></span> 个文件/文件夹 \
                                    </span> \
                                    <a node-type="check-btn-option" data-key="delete"> \
                                        <span class="fm-icon delete"></span> \
                                        <span class="btn-value">删除</span> \
                                    </a> \
                                    <a node-type="check-btn-option" data-key="download"> \
                                        <span class="fm-icon download-light"></span> \
                                        <span class="btn-value">下载</span> \
                                    </a> \
                                    <a node-type="check-btn-option" data-key="getimage"> \
                                        <span class="fm-icon drapout"></span> \
                                        <span class="btn-value">获取图片</span> \
                                    </a> \
                                </div>'),
            ModuleUpload: $.templates('<div class="fM-module-upload"> \
                                   <div class="upload-title"> \
                                       <span class="title">上传队列</span> \
                                       <span class="oss-icon close"></span> \
                                   </div> \
                                   <div class="upload-list-wrapper"> \
                                       <table class="upload-list"> \
                                       <thead> \
                                       <tr> \
                                            <th></th><th class="u-name">名称</th> \
                                            <th class="u-folder">目录</th> \
                                            <th class="u-size">大小</th> \
                                            <th class="u-status">状态</th> \
                                        </tr> \
                                       </thead> \
                                       <tbody class="upload-list-body"></tbody> \
                                       </table> \
                               </div>'),
            ModuleUploadList: $.templates('<tr class="list" data-uploadId="{{:ID}}" id="upload-{{:ID}}">\
                                    <th class="list-placeholder"></th> \
                                    <th class="u-name">{{:NAME}}</th> \
                                    <th class="u-folder">{{:KEY}}</th> \
                                    <th class="u-size">{{:SIZE}}</th>\
                                    <th class="u-status">{{:STATUS}}</th>\
                                    </tr>'),
            ModuleLog: $.templates('<div class="fM-module-log"> \
                                        <div class="log-head"> \
                                            <span>操作记录</span> \
                                        </div> \
                                        <ul class="log-list"> \
                                        </ul> \
                                    </div>'),
            ModuleLogLi: $.templates('<li class="log {{:type}}">{{:message}}</li>')
        },

        // 去除str两边的pat
        fMtrim = function(str, pat) {
            if (!str) return '';
            if (!pat) return $.trim(str);
            var pattern = new RegExp('^(?:' + pat + '*)([\\s\\S]*?)(?:' + pat + '*)$', 'g'),
                ret;
            ret = pattern.exec(str);
            if (ret)
                return ret[1];
            else return '';
        },

        // 去除str右边的pat
        rfMtrim = function(str, pat) {
            if (!str) return '';
            if (!pat) return $.trim(str);
            var pattern = new RegExp('([\\s\\S]*?)(?:' + pat + '*)$', 'g'),
                ret;
            ret = pattern.exec(str);
            if (ret)
                return ret[1];
            else return '';
        },

        // 去除str左边的pat
        lfMtrim = function(str, pat) {
            if (!str) return '';
            if (!pat) return $.trim(str);
            var pattern = new RegExp('^(?:' + pat + '*)([\\s\\S]*?)', 'g'),
                ret;
            ret = pattern.exec(str);
            if (ret)
                return ret[1];
            else return '';
        },

        /**
         * 验证目录名的合法性
         * @param value {String} 文件夹名
         */
        isLegalFolderName = function isLegalFolderName(value) {
            return /^[a-z0-9_-\s]+$/gi.test(value);
        },

        /**
         * 验证文件名的合法性
         * @param value {String} 文件夹名
         */
        isLegalFileName = function isLegalFolderName(value) {
            return /^[^\\/?%*:|"<>\.]+$/.test(value);
        },

        logger;

    // 上传类
    var Upload = {
        fileList: [],
        listElem: null,
        append: function(files) {
            var upload = this,
                tree = Tree.instance(),
                env = tree.resolveEnv(),
                fileData;
            $.each(files, function(index, file) {
                var fileData = {
                    file: file,
                    service: env.service,
                    bucket: env.bucket,
                    key: env.key,
                    id: generateId()
                };
                upload.insertIntoList(fileData);
                upload.fileList.push(fileData);
            });
            this.run();
        },
        run: function() {
            var file,
                upload = this;
            if (upload.ctrl) {
                return;
            } else {
                upload.ctrl = true;
                file = upload.getFile();
                if (file === null) {
                    // 上传队列已空
                    upload.ctrl = false;
                    return;
                } else {
                    file.service.uploadFile(file.bucket, file.key, file.file, file.id)
                        .then(function() {
                            upload.ctrl = false;
                            setTimeout(function() {
                                upload.run.call(upload);
                            }, 0);
                        }, function() {
                            // 可在这里加入稍后重现上传
                            if (!file.retry || file.retry <= 2) {
                                if (file.retry)
                                    file.retry++;
                                else
                                    file.retry = 1;
                                upload.fileList.push(file);
                            }
                            $('#upload-' + file.id).find('.list-placeholder').css('background-color', '#E33E3E');
                            upload.ctrl = false;
                            setTimeout(function() {
                                upload.run.call(upload);
                            }, 0);
                        });
                }
            }
        },
        insertIntoList: function(fileData) {
            var upload = this,
                tmpl = '';
            tmpl = TemplateEngine(Template.ModuleUploadList, {
                NAME: fileData.file.name,
                KEY: fileData.key,
                SIZE: formatFileSize(fileData.file.size),
                STATUS: 'waiting',
                ID: fileData.id
            });
            upload.listElem.append(tmpl);
        },
        getFile: function() {
            var upload = this;
            if (upload.fileList.length === 0)
                return null;
            else
                return upload.fileList.shift();
        }
    }

    /**
     *  对后端服务器节点的抽象, 每个Service实例对应一个后台服务, 用户和后台进行交互
     *
     * @param config {Object} 配置信息
     */
    var Service = function(config) {

        // 服务的id
        this.__ID = generateId();

        // 服务的名称
        this.serviceName = config.serviceName || 'unknow' + this.__ID;

        // 配置
        this.config = _.extend({

            // 服务的域
            server: '',

            // 获取目录
            listFolders: {},

            // 获取文件
            getObjects: {},

            // 获取buckets
            listBuckets: {},

            // 删除bucket
            deleteBucket: {},

            // 删除文件
            deleteObject: {},

            // 移动文件
            moveObject: {},

            // 创建文件
            createObject: {},

            // 重命名一个文件
            renameObject: {}

        }, config);

        // 目录状态，
        this.children_status = false;

        // 子目录
        this.children = [];

        // 服务器状态
        this.status = false;

        // 类型
        this.type = 'Service';

        // 状态
        this.toggle = 'close';
    };

    /**
     * 检查其通信状况
     * 通过发送简单的状态请求
     */
    Service.prototype.checkStatus = function checkStatus() {
        var defer = $.Deferred();
        setTimeout(function() {
            var rand = parseInt(Math.random() * 10);
            if (rand < 5)
                defer.reject();
            else
                defer.resolve();
        }, 1000);
        return defer.promise();
    }

    /**
     * 获取当前服务的状态
     * @TODO 还没想好改咋做
     */
    Service.prototype.isAvailable = function(service) {
        return service.status;
    }

    /**
     * 获取buckets
     */
    Service.prototype.getBuckets = function() {
        var service = this;
        return $.ajax({
            url: service.config.server + service.config.listBuckets.endpoint,
            type: service.config.listBuckets.method
        });
    }

    /**
     * 根据当前的bucket 和 key获取objects
     *
     * @param bucket object key所属的bucket的信息
     * @param string key    所需要查找的key
     */
    Service.prototype.getObjects = function(bucket, key) {
        var service = this;
        console.log(bucket);
        return $.ajax({
            url: service.config.server + service.config.listObjects.endpoint,
            type: service.config.listObjects.method,
            data: {
                bucket: bucket.Name,
                key: key,
                Addition: bucket.Addition
            }
        });
    }

    /**
     * 根据当前的bucket 和 key获取folders
     *
     * @param bucket object key所属的bucket的信息
     * @param string key    所需要查找的key
     */
    Service.prototype.getFolders = function(bucket, key) {
        var service = this;
        console.log(bucket, key);
        return $.ajax({
            url: service.config.server + service.config.listFolders.endpoint,
            type: service.config.listFolders.method,
            data: {
                bucket: bucket.Name,
                key: key,
                Addition: bucket.Addition
            }
        });
    };

    /**
     * 在key下创建新目录，返回新目录的信息
     *
     * @param bucket object key所属的bucket的信息
     * @param string key
     */
    Service.prototype.createFolder = function(bucket, key, value) {
        var service = this;
        return $.ajax({
            url: service.config.server + service.config.createFolder.endpoint,
            type: service.config.createFolder.method,
            data: {
                bucket: bucket.Name,
                key: key,
                Addition: bucket.Addition
            }
        });
    };

    /**
     * 删除key的文件或目录
     *
     */
    Service.prototype.deleteFolder = function(bucket, key) {
        var service = this;
        return $.ajax({
            url: service.config.server + service.config.deleteFolder.endpoint,
            type: service.config.deleteFolder.method,
            data: {
                bucket: bucket.Name,
                key: key,
                Addition: bucket.Addition
            }
        });
    }

    /**
     * 重命名一个object,
     *
     */
    Service.prototype.reNameObject = function(bucket, srcKey, dstKey) {
        var service = this;
        return $.ajax({
            url: service.config.server + service.config.renameObject.endpoint,
            type: service.config.renameObject.method,
            data: {
                bucket: bucket.Name,
                srcKey: srcKey,
                dstKey: dstKey,
                Addition: bucket.Addition
            }
        });
    };

    /**
     *
     * 删除指定的keys
     */
    Service.prototype.deleteObjects = function(bucket, keys) {
        var service = this;
        return $.ajax({
            url: service.config.server + service.config.deleteObjects.endpoint,
            type: service.config.deleteObjects.method,
            data: {
                bucket: bucket.Name,
                keys: keys || [],
                Addition: bucket.Addition
            }
        });
    }

    /**
     *
     * 上传文件
     */
    Service.prototype.uploadFile = function(bucket, key, file, id) {
        var service = this,
            formData = new FormData();
        formData.append('bucket', bucket.Name);
        formData.append('key', key || '');
        formData.append('Addition', bucket.Addition);
        var elem = $('#upload-' + id),
            placeholder = elem.find('.list-placeholder').css('background-color', '#3E8BE3'),
            status = elem.find('.u-status'),
            percent;
        formData.append('file', file);
        status.text('uploading');
        var defer = $.Deferred();
        $.ajax({
            url: service.config.server + service.config.uploadObjects,
            type: 'POST',
            data: formData,
            processData: false,
            contentType: false,
            xhr: function() {
                var xhr = jQuery.ajaxSettings.xhr();
                xhr.upload.onload = function() {
                    status.text('done');
                }
                xhr.upload.onprogress = function(ev) {
                    if (ev.lengthComputable) {
                        percent = 100 * ev.loaded / ev.total;
                        placeholder.css('width', percent.toFixed(0) + '%');
                    }
                }
                return xhr;
            },
            success: function(data) {
                status.text('done');
                defer.resolve();
            },
            error: function(err) {
                status.text('failed');
                defer.reject();
            }
        });
        return defer.promise();
    }

    // 目录树
    var Tree = function(elem) {
        // 利用工厂模式来注册service
        this.elem = elem.find('.ServiceList').first();
        if (this.elem.length === 0)
            throw new Error('Tree can\'t be init on null');
        this.services = [];
        this.currentServiceId = -1;
        this.currentBucketId = -1;
        this.currentFolderId = -1;
        this.__cache = {};
    };

    /**
     * 解析当前环境
     *
     * @param key {String}
     * @param flag {Boolean} 为true 则解析key
     * @return {Object}
     */
    Tree.prototype.resolveEnv = function(key, flag) {
        var tree = this,
            currentBucket = tree.find(tree.currentBucketId),
            currentService = tree.find(tree.currentServiceId),
            // 当前的工作目录
            currentFolder = tree.find(tree.currentFolderId);
        if (!currentBucket || !currentService)
            throw ('Can\'t resolve current Environment');
        else {

            if (key && flag) {
                currentFolder = tree.resolveNodeFromKey(key);
                if (currentFolder) {
                    tree.currentFolderId = currentFolder.__ID;
                }
            }
            return {
                service: currentService,
                bucket: currentBucket,
                folder: currentFolder,
                key: key !== undefined ? key : (currentFolder ? currentFolder.Key : '/'),
            }
        }
    };

    /**
     * 根据key获取其node
     *
     * @param key {String} 需要解析的key
     * @return {Object}
     */
    Tree.prototype.resolveNodeFromKey = function(key) {
        var tree = this,
            currentBucket = tree.find(tree.currentBucketId),
            currentService = tree.find(tree.currentServiceId),
            currentFolder = tree.find(tree.currentFolderId),
            node;
        if (!currentBucket || !currentService)
            throw ('Can\'t resolve current Environment');

        // 是从当前目录向下寻找，还是从根目录向下寻找
        // @TODO 修改成根据key来缓存， 提高查找速度
        if((currentFolder && currentFolder.Key && new RegExp('^' + key).test(currentFolder.Key)) || !currentFolder) {
            node = currentBucket;
        } else {
            node = currentFolder;
        }

        function Traverse(nodeTemp, key) {
            var child;
            if (!nodeTemp) return null;
            if (nodeTemp && nodeTemp.Key === key) return nodeTemp;

            for (var i = 0, len = nodeTemp.children.length; i < len; i++) {
                child = nodeTemp.children[i];
                if (child.Key === key)
                    return child;
            }
            for (i = 0, len = nodeTemp.children.length; i < len; i++) {
                child = Traverse(nodeTemp.children[i], key)
                if (child)
                    return child;
            }
            return null;
        }
        return Traverse(node, key);
    }

    // 检查两个节点是否在同一个bucket下
    Tree.prototype.isSameBucket = function(id1, id2) {
        var tree = this;
        var node1 = tree.find(id1),
            node2 = tree.find(id2);
        if (node1 === undefined || node2 === undefined)
            return false;
        else if (node1.BucketId !== node2.BucketId)
            return false;
        else {
            return [node1, node2];
        }
    }

    /**
     * 获取其实例
     * 全局只维护一个tree实例
     */
    Tree.instance = (function() {
        var instance = null;
        return function(elem) {
            if (instance === null)
                return (instance = new Tree(elem));
            else
                return instance;
        }
    })();

    /**
     * 在tree上注册service
     *
     * @param service {Object} 要注册的servcie实例
     */
    Tree.registerService = function(service) {
        var tree = Tree.instance();
        // 此处存储的数据仅供tree用来查找之用
        tree.services.push(service);
        tree.__cache[service.__ID] = service;
        tree.buildServiceDom(service);
    };

    /**
     * 构建servicedom节点
     *
     * @param service {Object} service数据
     */
    Tree.prototype.buildServiceDom = function(service) {
        var tree = this;
        console.log(service);
        $(Template.ServiceList.render(service)).appendTo(tree.elem);

        // 确保其接口正确
        // Interface.ensureImplements(service, ServiceInterface);

        // 确保其服务可用，通过测试链接
        // service.checkStatus().then(function() {
        //     tree.serviceEnabled(service);
        // }, function() {
        //     tree.serviceDisabled(service);
        // });
        tree.serviceEnabled(service);
    };

    /**
     * 更改当前service节点的状态为不可用
     *
     * @param service {Object} service数据
     */
    Tree.prototype.serviceDisabled = function(service) {
        var tree = this,
            service_id = typeof service !== 'object' ? service : service.__ID,
            elem = $('#flist-' + service_id);
        if (elem.length) {
            elem.find('.fnode-icon .oss-icon').removeClass('server').addClass('server-offline');
            service = tree.find(service_id);
            service.status = false;
        }
    };

    /**
     * 更改当前service节点的状态为可用
     *
     */
    Tree.prototype.serviceEnabled = function(service) {
        var tree = this,
            service_id = typeof service === 'number' ? service : service.__ID,
            elem = $('#flist-' + service_id);
        if (elem.length) {
            elem.find('.fnode-icon .oss-icon').removeClass('server-offline').addClass('server');
            service = tree.find(service_id);
            service.status = true;
        }
    };

    Tree.prototype.find = function(id) {
        return this.__cache[id];
    };

    // 创建一个fid的子节点
    Tree.prototype.CreateNode = function(fid, newNodeValue) {
        var tree = this;
        node = tree.find(fid);
        // 不允许在service下创建bucket
        if (node.type === 'Service')
            return;
        var service = tree.find(node.ServiceId),
            bucket = tree.find(node.BucketId),
            key = node.Key,
            defer = $.Deferred();
        // 为了保证安全，后台还必须对key进行进一步验证，
        if (!isFolder(node.Key)) {
            defer.reject();
        } else {
            newNodeValue = fMtrim(newNodeValue) + '/';
            service.createFolder(bucket, node.Key, newNodeValue)
                .done(function(response) {
                    // 添加进当前节点
                    //只有当前节点的子节点为开启状态才插入dom
                    if (node.children_status === true) {
                        tree.insertNode(node, {
                            Key: node.Key + newNodeValue,
                            Name: newNodeValue
                        })
                    }
                    defer.resolve();
                })
                .fail(function(err) {
                    // 此处应该提醒错误
                    defer.reject(err);
                });
        }
        return defer.promise();
    };

    // 在parent的子节点中插入一个新的节点
    Tree.prototype.insertNode = function(parent, data) {
        var tree = this,
            newNode = {
                type: 'Folder',
                __ID: generateId(),
                children_status: false,
                BucketId: parent.BucketId || parent.__ID,
                ServiceId: parent.ServiceId || parent.__ID,
                ParentId: parent.__ID,
                Key: data.Key,
                Name: data.Name || (resolveKeyName(folder.Key)).name,
                toggle: 'close',
                children: []
            },
            tmpl = '';
        parent.children.push(newNode);
        tree.__cache[newNode.__ID] = newNode;
        tmpl += TemplateEngine(Template.FolderList, newNode);
        $('#flist-' + parent.__ID + ' .fnode-children').first().prepend(tmpl).draggable()
    }

    /**
     * 重命名一个节点
     *
     */
    Tree.prototype.renameNode = function(fid, new_name) {
            var tree = this,
                node = tree.find(fid),
                defer = $.Deferred();
            if (node && node.type === 'Folder') {
                new_name = fMtrim(new_name, '/');
                if (isLegalFolderName(new_name)) {
                    var originalKey = rfMtrim(node.Key, '/'),
                        targetKey,
                        key = originalKey.split('/'),
                        service = tree.find(node.ServiceId),
                        bucket = tree.find(node.BucketId);
                    key[key.length - 1] = new_name;
                    targetKey = key.join('/');
                    service.reNameObject(bucket, originalKey, targetKey)
                        .done(function(response) {
                            node.Name = new_name;
                            tree.__renameNode(node, targetKey + '/');
                            $('#flist-' + node.__ID).find('.fnode-name:first').text(new_name);
                            defer.resolve(node);
                        })
                        .fail(function(err) {
                            defer.reject();
                        });


                } else {
                    defer.reject();
                    //throw new Error('非法的文件名');
                }
            } else {
                defer.reject();
                //throw new Error('Can\'t Rename Bucket or Service');
            }
            return defer.promise();
    }

    // 修改包括自己和孩子在内的子节点的key
    Tree.prototype.__renameNode = function(rnode, key) {
        var oldkey = rnode.Key,
            oldkeylen = oldkey.length;

        function Traverse(node) {
            if (node) {
                node.Key = key + node.Key.substr(oldkeylen);
                for (var i = 0, len = node.children.length; i < len; i++)
                    Traverse(node.children[i]);
            }
        }
        Traverse(rnode);
    }

    /**
     * 删除指定的节点
     * @param string fid 要删除的节点
     */
    Tree.prototype.deleteNode = function(fid, cd) {
        var tree = this,
            node = tree.find(fid);

        // 只能删除目录，不允许删除bucket和service
        if (node.type === 'Folder') {
            if (!node) {
                alert('Can\'t find the Folder.');
                return;
            }
            var service = tree.find(node.ServiceId),
                bucket = tree.find(node.BucketId);
            if (service && bucket) {

                // 调用其服务删除其节点
                service.deleteFolder(bucket, node.Key).done(function(response) {
                    //开始删除其节点
                    tree.__deleteNode(node);
                    if (cd)
                        cd(true);

                }).fail(function(err) {
                    if (cd)
                        cd(false);
                });
            }
        } else {
            alert('Can \'t delete Bucket or Service.');
        }
    };

    /**
     * 从树中删除节点
     * @param object | string | int dnode 要删除的节点
     *
     */
    Tree.prototype.__deleteNode = function(dnode) {
        var tree = this;
        if (typeof dnode === 'string' || typeof dnode === 'number')
            dnode = tree.find(dnode);
        if (!dnode) return;

        var fid = dnode.__ID;
        // 从缓存中删除
        function deleteCache(node) {
            if (node)
                delete tree.__cache[node.__ID];
            for (var i = 0, len = node.children.length; i < len; i++) {
                deleteCache(node.children[i]);
            }
        }

        deleteCache(dnode);

        function deleteObject(node, delnode) {
            for (var i = 0, len = node.children.length; i < len; i++) {
                if (node.children[i].__ID === delnode.__ID) {
                    node.children.splice(i, i);
                    return true;
                }
            }
            for (i = 0, len = node.children.length; i < len; i++) {
                if (deleteObject(node.children[i], delnode) === true)
                    return true;
            }
            return false;
        }
        var bucket = tree.find(dnode.ParentId);
        deleteObject(bucket, dnode);
        $('#flist-' + fid).remove();
    }

    /**
     * 构建buckets节点
     * 将数据同时添加进dom树 和 树中
     *
     * @param service_id {Int}  服务器id
     * @param parent_id  {Int}  父目录
     * @param folders  {Object}  data
     */
    Tree.prototype.buildBuckets = function(service_id, data) {
        var tree = this,
            bucket,
            tmpl = '',
            service = tree.find(service_id);

        // 避免多次添加
        if (!service || service.children_status === true)
            return;

        if(!$.isPlainObject(data) || !$.isArray(data.buckets)) {
            logger('错误的数据格式', 'error');
            throw new Error('错误的数据格式');
            return;
        }

        // 初始化每个bucket 节点
        $.each(data.buckets, function(index) {
            bucket =data.buckets[index];

            $.extend(bucket, {
                type : 'Bucket',
                __ID : generateId(),
                children_status : false,
                Key : '/',
                ServiceId : service_id,
                toggle : 'close',
                children : [],
                Additions : bucket.Additions
            });
            bucket.BucketId = bucket.__ID;
            service.children.push(bucket);
            tree.__cache[bucket.__ID] = bucket;
            tmpl += Template.BucketList.render(bucket);
        });

        $('#flist-' + service.__ID + ' .fnode-children').first().append(tmpl);
        service.children_status = true;
    }

    /**
     * 构建folders
     * 将数据同时添加进dom树 和 树中
     *
     * @param service_id {Int} 服务器id
     * @param parent_id {Int} 父目录
     * @param folders {Object} 数据
     */
    Tree.prototype.buildFolders = function(service_id, parent_id, data) {
        var tree = this,
            folder,
            newNode,
            tmpl = '',
            parent = tree.find(parent_id),
            service;

        if (!parent || parent.children_status === true)
            return;

        if(!$.isPlainObject(data) || !$.isArray(data.folders)) {
            logger('错误的数据格式', 'error');
            throw new Error('错误的数据格式');
            return;
        }

        $.each(data.folders, function(index) {
            folder = data.folders[index];
            newNode = {
                type: 'Folder',
                __ID: generateId(),
                children_status: false,
                BucketId: parent.BucketId || parent.__ID,
                ServiceId: parent.ServiceId || parent.__ID,
                ParentId: parent_id,
                Key: folder.Key,
                Name: folder.Name || (resolveKeyName(folder.Key)).name,
                toggle: 'close',
                children: []
            };
            parent.children.push(newNode);
            tree.__cache[newNode.__ID] = newNode;
            tmpl += Template.FolderList.render(newNode);
        });
        // 开启拖拽
        var elems = $('#flist-' + parent_id + ' .fnode-children').first().append(tmpl).find('.fnode-list');
        elems.draggable({
            opacity: 0.7,
            helper: "clone"
        });
        // TODO 审查代码
        $.each(elems, function() {
            $(this).droppable({
                greedy: true,
                accept: '.fnode-list , .grid',
                tolerance: "pointer",
                drop: function(event, ui) {
                    $(this).find('.draggable-placeholder:first').hide();

                    var from = ui.draggable,
                        fromKey,
                        to = $(this),
                        toKey;
                    if (from.hasClass('fnode-list') && to.hasClass('fnode-list')) {
                        // fnode-list   to   fnode-list
                        // 必须为铜service下的，同bucket下的节点才可以拖动
                        // to 必须为目录
                        nodeRelationship = tree.isSameBucket(from.attr('data-fid'), to.attr('data-fid'));
                        if (nodeRelationship) {
                            // 在此处可以进行copy
                            if (event.metaKey) {
                                // 复制
                                tree.copyNode(nodeRelationship[0], nodeRelationship[1]);
                            } else {
                                // 移动到
                                tree.moveNode(nodeRelationship[0], nodeRelationship[1]);
                            }
                        } else {
                            alert('所移动的文件夹必须同属一个bucket下');
                        }
                    } else if (from.hasClass('grid') && to.hasClass('grid')) {
                        // 一定在同一个grid下，但还是需要检查下
                        // to必须为目录
                        if (to.attr('data-type') !== 'dir') {
                            alert('接受项必须为目录')
                        } else {
                            if (from.attr('data-type') === 'dir') {
                                // 目录到目录移动
                            } else {
                                // 文件移动到目录
                            }
                        }
                    } else if (from.hasClass('grid') && to.hasClass('fnode-list')) {
                        // grid   to  node-list  必须为同bucket下的
                        var fromNode = tree.resolveNodeFromKey(from.attr('data-key')),
                            toNode = tree.find(to.attr('data-fid'));
                        nodeRelationship = tree.isSameBucket(fromNode.attr('data-fid'), to.attr('data-fid'));
                        if (nodeRelationship) {
                            // 在此处可以进行copy
                            if (event.metaKey) {
                                // 复制
                                tree.copyNode(nodeRelationship[0], nodeRelationship[1]);
                            } else {
                                // 移动到
                                tree.moveNode(nodeRelationship[0], nodeRelationship[1]);
                            }
                        } else {
                            alert('所移动的文件夹必须同属一个bucket下');
                        }
                    }
                },
                over: function(event, ui) {
                    $(this).find('.draggable-placeholder:first').show();
                },
                out: function(event, ui) {
                    $(this).find('.draggable-placeholder:first').hide();
                }
            });
        });
        parent.children_status = true;
    }

    /**
     * 折叠活展开当前节点
     * 当status指定时候只改变状态，不进行折叠
     *
     * @param fnode {int} fnode  要折叠的节点
     * @param status {string} 指定的模式
     */
    Tree.prototype.toggleNode = function(fnode, status) {
        var felem, collapse, status, child;
        if (typeof fnode === 'string' || typeof fnode === 'number') {
            fnode = this.find(fnode);
        }
        if (fnode) {
            felem = $('#flist-' + fnode.__ID);
            collapse = felem.find('.fnode-collapse .oss-icon-s').first();
            status = status || fnode.toggle;
            collapse.removeClass('pending').removeClass('minus').removeClass('plus');
            switch (status) {
                case 'pending':
                    collapse.addClass('pending');
                    return;
                    break;
                case 'open':
                    collapse.addClass('plus');
                    fnode.toggle = 'close';
                    break;
                case 'close':
                    collapse.addClass('minus');
                    fnode.toggle = 'open';
                    break;
            }
            child = felem.find('.fnode-children').first();
            // 当不指定status时才进行展开
            if (child.length && !arguments[1]) {
                child.slideToggle();
            }

        }
    };

    /**
     * 所有数据的获取都要经过分发器, 由is_toggle来决定是否是目录折叠
     *
     * @param type {String} 节点的类型
     * @param fid  {String} 节点的id
     * @param is_toggle {Boolean} 是否折叠
     */
    Tree.prototype.distributor = function(type, fid, is_toggle) {
        var tree = this,
            fnode = tree.find(fid);
        if (!fnode || fnode.type !== type) {
            logger('There is some wrong in distributor', 'error');
            throw new Error('There is some wrong in distributor');
        }

        var defer = $.Deferred(),
            childrenElem;

        switch (type) {
            case 'Service':
                tree.toggleNode(fnode, 'pending');
                fnode.getBuckets()
                    .done(function(response) {
                        logger('成功获取 ' + fnode.serviceName + ' 的buckets', 'success');
                        // 成功获取bucket, 开始构建bucket dom
                        tree.buildBuckets(fnode.__ID, response);
                        if (is_toggle) {
                            tree.toggleNode(fnode);
                        }
                        defer.resolve(response);
                    })
                    .fail(function(err) {
                        tree.toggleNode(fnode, 'open');
                        defer.reject(err);
                    });

                break;
            case 'Folder':
            case 'Bucket':
                var service = tree.find(fnode.ServiceId),
                    bucket  = tree.find(fnode.BucketId),
                    dataGetter;
                if (is_toggle)
                    dataGetter = service.getFolders(bucket, fnode.Key);
                else {
                    // 转化当前环境
                    tree.currentServiceId = fnode.ServiceId;
                    tree.currentBucketId = fnode.BucketId;
                    if (type === 'Folder')
                        tree.currentFolderId = fid;
                    dataGetter = service.getObjects(bucket, fnode.Key);
                }
                dataGetter.then(function(response) {
                    logger('成功获取 ' + fnode.Name + ' 的目录', 'success');
                    // 构建目录树
                    tree.buildFolders(service.__ID, fnode.__ID, response);
                    if (is_toggle) {
                        tree.toggleNode(fnode);
                    }
                    defer.resolve(response);
                }, function(err) {
                    tree.toggleNode(fnode, 'open');
                    defer.reject(err);
                });
                break;
        }
        return defer.promise();
    }


    /**
     * 绑定事件
     * 绑定服务
     * 映射数据 ,和动作到服务
     * 初始化模版
     *
     * @param {Element} fMWrapper     插件最外层
     * @param {Object}  options       配置参数
     */
    var Plugin = function(fMWrapper, options) {
        var plugin = this;

        // 参数合并
        plugin.options = $.extend({}, defaults, options);

        // 主框架
        plugin.element = fMWrapper;

        // 对各个模块的缓存
        plugin.module =  {
            siderElem: null,
            toolBar: null,
            crumbs: null,
            listView: null,
            gridView: null,
        };
        // @TODO remove
        plugin.modules = plugin.module;

        // 默认显示模式
        plugin.viewType = 'list';

        //
        plugin.contentElement = null;

        // 初始化 dom
        plugin.init();

        // 初始化 事件
        plugin.initEvent();
    };

    /**
     * 负责模版的初始化
     * 事件的绑定
     * 模块的划分
     */
    Plugin.prototype.init = function() {
        var plugin = this,
            options = plugin.options,
            module = plugin.modules,
            modules = plugin.modules,
            tree;

        // 在控件上取消鼠标右键点击功能
        document.oncontextmenu = function(e) {
            var target = $(e.target);
            if (target.closest('.fMWrapper').length)
                return false;
            return true;
        };

        // 主体dom结构
        var mainHtml = $(Template.Main.render({
            Title: options.Title,
            Width: options.Width,
            Height: options.Height
        })).appendTo(plugin.element);

        // 初始化 sider 目录树
        plugin.modules.siderElem = mainHtml.find('.fManagerSider');

        // 初始化 文件显示区
        plugin.contentElement = mainHtml.find('.fManagerBody-content');

        // 初始化 底部操作区
        plugin.footerElement = mainHtml.find('.fManagerBody-foot');

        // 初始化目录树;
        tree = Tree.instance(plugin.modules.siderElem);

        // 注册服务
        if (!options.Service || !$.isArray(options.Service) || options.Service.length === 0)
            throw new Error('Request At least 1 Service ,provided 0.');

        // 在目录树上注册服务
        $.each(options.Service, function(index) {
            Tree.registerService(new Service(options.Service[index]));
        });

        // 初始化侧边栏弹窗工具栏
        (function() {
            // 所有context集合
            var contextMenu = $(Template.ModuleContextMenu.render()).appendTo(plugin.contentElement);
            plugin.modules.contextMenu = {
                elem: contextMenu,
                // 目录侧边栏工具
                folderContext: {
                    elem: contextMenu.find('.menu-node'),
                    currentElem: null
                },

                // service 侧边栏工具
                serviceContext: {
                    elem: contextMenu.find('.menu-service'),
                    currentElem: null
                },

                // grid view 侧边栏工具
                gridViewContext: {
                    elem: contextMenu.find('.grid-view-context'),
                    currentElem: null
                }
            }
        }());

        // 初始化工具栏 ,上传控件, 视图按钮
        (function() {
            plugin.modules.toolBar = $(Template.ModuleToolbar.render()).appendTo(plugin.contentElement);
            // 视图切换
            plugin.modules.toolBar.switchView = (function() {
                var list_view = plugin.modules.toolBar.find('.toolbar-list-view .fm-icon'),
                    grid_view = plugin.modules.toolBar.find('.toolbar-grid-view .fm-icon');
                return function() {
                    list_view.toggleClass('list-selected')
                        .toggleClass('list');
                    grid_view.toggleClass('grid-selected')
                        .toggleClass('grid');
                }
            }());
        }());

        // 初始化路径导航
        plugin.modules.crumbs = $(Template.ModuleCrumbs.render()).appendTo(plugin.contentElement);

        // 初始化列表视图
        plugin.modules.listView = $(Template.ModuleListView.render()).appendTo(plugin.contentElement);
        plugin.modules.listView.chkallBtn = plugin.modules.listView.find('.list-checkall .fm-icon');
        plugin.modules.listViewContent = plugin.modules.listView.find('.list-view-content');

        // 初始化grid视图列表
        plugin.modules.gridView = $(Template.ModuleGridView.render()).appendTo(plugin.contentElement);
        plugin.modules.gridViewContent = plugin.modules.gridView.find('.grid-view-content');

        // 初始化选择控件
        plugin.modules.checkAction = {
            elem: $(Template.ModuleCheckAction.render()).appendTo(plugin.footerElement),
            items: []
        }

        // 初始化上传控件
        plugin.modules.UploadElem = $(Template.ModuleUpload.render()).appendTo(plugin.contentElement);
        plugin.modules.UploadList = module.UploadElem.find('.upload-list');
        plugin.modules.UploadElem.delegate('.upload-title .close', 'click', function(e) {
            modules.UploadElem.hide();
            // if (modules.UploadList.is(':visible')) {
            //     modules.UploadElem.animate({
            //         height: '35px'
            //     }, 1000);
            //     modules.UploadList.hide();
            // } else {
            //     modules.UploadElem.animate({
            //         height: '400px'
            //     }, 1000);
            //     modules.UploadList.show();
            // }
        });
        // 绑定上传列表给Upload类
        Upload.listElem = plugin.modules.UploadList;

        /**
         * log 模块，用来记录操作
         * 红色代表错误信息
         * 蓝色代表系统信息
         * 绿色代表成功信息
         */
        plugin.modules.Log = $(Template.ModuleLog.render()).appendTo(plugin.contentElement);
        logger = (function logger() {
            var loglist = plugin.modules.Log.find('.log-list');
            return function(message, type) {
                type = type || 'sys';
                if(!plugin.options.debug && type === 'sys')
                    return;
                $(Template.ModuleLogLi.render({message:message, type: type})).appendTo(loglist);
                // 将滚动条置于最低下
                loglist[0].scrollTop = loglist[0].scrollHeight;
            };
        }());

        //上传控件事件
        //plugin.module.UploadModule。delegate('')

    };

    /**
     * 初始化事件
     */
    Plugin.prototype.initEvent = function initEvent() {
        logger('开始初始化事件');
        var plugin = this,
            options = plugin.options,
            modules = plugin.modules;

        /**
         * 目录点击事件
         * service双击会加载buckets
         * buckets 双击会加载目录
         * 目录双击会加载子目录和文件
         *
         * @param is_toggle {Boolean} 用以判断是否展开 Service 永远展开
         */
         modules.siderElem.delegate('.fnode-list', 'dblclick', function(e, is_toggle) {
             e.preventDefault();
             e.stopPropagation();
             var elem = $(this),
                 type = elem.attr('node-type'),
                 fid  = elem.attr('data-fid'),
                 tree = Tree.instance();
             is_toggle = type === 'Service' ? true : !!is_toggle;

             if (!is_toggle) {
                 if (modules.siderElem.lastClickElem)
                     modules.siderElem.lastClickElem.toggleClass('currentNode');
                 modules.siderElem.lastClickElem = elem.find('.select-placeholder').first().toggleClass('currentNode');
             }

             // 避免多次加载
             if (elem.attr('data-status') === 'loading') {
                 alert('正在加载中，请稍等');
                 return;
             } else if (elem.attr('data-status') === 'loaded' && is_toggle) {
                 if (type === 'Service')
                     tree.toggleNode(fid);
                 return;
             } else {
                 elem.attr('data-status', 'loading');
             }

             // 刷新crumbs
             plugin.modules.crumbs.trigger('refreshStatusBeforeLoad');

             tree.distributor(type, fid, is_toggle).then(function(data) {
                 if (type === 'Service') {
                     plugin.modules.crumbs.trigger('refreshStatusAfterLoad', [null, data.buckets.length]);
                     elem.attr('data-status', 'loaded');
                 } else if (type === 'Bucket' || type === 'Folder') {
                     plugin.modules.crumbs.trigger('refreshStatusAfterLoad', [null, data.folders.length + (data.files && data.files.length || 0)]);
                     elem.attr('data-status', 'loaded');
                     if (!is_toggle) {
                         // 将数据加载进视图
                         if (plugin.viewType === 'list')
                             plugin.refreshListView(data);
                         else if (plugin.viewType === 'grid')
                             plugin.refreshGridView(data);
                         // 刷新crumbs
                         plugin.modules.crumbs.trigger('refreshCrumbs', [tree.find(fid).Key]);
                     }
                 }
             }, function(error) {
                 plugin.modules.crumbs.trigger('refreshStatusAfterLoad', formatError(error));
                 logger(formatError(error), 'error');
                 elem.attr('data-status', 'error')
             });
         });

         // 侧边栏折叠事件
         modules.siderElem.delegate('.fnode-collapse', 'click', function(e) {
             e.preventDefault();
             e.stopPropagation();
             var elem = $(this),
                 parent = elem.closest('.fnode-list');
             if (parent.length) {
                 var type = parent.attr('node-type'),
                     fid = parent.attr('data-fid'),
                     tree = Tree.instance();
                 if (parent.attr('data-status') !== 'loaded') {
                     parent.trigger('dblclick', [true])
                 } else {
                     tree.toggleNode(fid)
                 }
             }
         });

         modules.gridViewContent.delegate('.grid-check .oss-icon', 'click', function(e) {
             var elem = $(this),
                 chitems = plugin.module.checkAction.items,
                 grid = elem.closest('.grid');
             elem.toggleClass('check_b').toggleClass('blank_b');
             if (elem.hasClass('check_b')) {
                 // 选中
                 chitems.push({
                     key: grid.attr('data-key'),
                     name: grid.attr('data-name'),
                     address: grid.attr('data-address') || '',
                 });
             } else {
                 // 撤销
                 for (var i = 0, len = chitems.length, key = grid.attr('data-key'); i < len; i++) {
                     if (chitems[i].key === key) {
                         chitems.splice(i, 1);
                         break;
                     }
                 }
             }
             toggleCheckActions();
         });

         // 避免折叠事件冒泡
         modules.siderElem.delegate('.fnode-collapse', 'dblclick', function(e) {
            e.preventDefault();
            e.stopPropagation();
         });

         /**
          *  目录侧边栏右键菜单, service 会显示service菜单， folder会显示folder菜单
          *  目前只有folder菜单可以用，菜单包括
          *  － 新建文件夹，
          *  － 复制到
          *  － 重命名
          *  － 删除
          */
         modules.siderElem.delegate('.fnode-list', 'contextmenu', function(e) {
             e.preventDefault();
             e.stopPropagation();
             var elem = $(this),
                 x = e.originalEvent.x || e.originalEvent.layerX || 0,
                 y = e.originalEvent.y || e.originalEvent.layerY || 0,
                 type = elem.attr('node-type'),
                 context;

             if (type === 'Service')
                 context = modules.contextMenu.serviceContext;
             else if (type === 'Folder')
                 context = modules.contextMenu.folderContext;
             else
                 return;
             context.elem.show();
             if (x && y) {
                 context.elem.css('left', x + 'px').css('top', y + 'px');
             }
             modules.siderElem.find('.select-placeholder').removeClass('contextActive');
             $(this).find('.select-placeholder').first().toggleClass('contextActive');
             context.currentElem = $(this);
         });

         // 目录菜单 mouseover 效果
         modules.contextMenu.elem.delegate('ul', 'mouseleave', function(e) {
             modules.siderElem.find('.select-placeholder').removeClass('contextActive');
             $(this).hide();
         });

         // 目录树 mouserover 效果
         modules.siderElem.delegate('.fnode-list', 'mouseover mouseout', function(e) {
             e.preventDefault();
             e.stopPropagation();
             $(this).find('.select-placeholder').first().toggleClass('activeNode');
         });

         function toggleEditNameBox(editnameElem) {
             if (editnameElem.is(':hidden')) {
                 editnameElem.show();
                 var oldValue = editnameElem.prev('.fnode-name').text();
                 (editnameElem.find('.box').val(oldValue)[0]).focus();
             } else {
                 editnameElem.hide();
             }
         }

         // 目录树菜单
         modules.contextMenu.folderContext.elem.delegate('li', 'click', function(e) {
             e.preventDefault();
             e.stopPropagation();
             var folderContext = modules.contextMenu.folderContext,
                 listNodeElem = folderContext.currentElem,
                 fid = listNodeElem.attr('data-fid'),
                 type = $(this).attr('data-key');
             switch (type) {
                 case 'delete':
                     tree.deleteNode(fid);
                     folderContext.elem.hide();
                     break;
                 case 'moveto':

                 case 'rename':
                     var editnameElem = listNodeElem.find('.node-edit-name:first');
                     toggleEditNameBox(editnameElem);
                     break;
                 case 'createnew':
                     var createNewElem = listNodeElem.find('.nodeCreateBox:first');
                     createNewElem.show();
                     folderContext.elem.hide();
                     createNewElem.find('.newNodeInput')[0].focus();
                     break;

             }
         });

         // 修改名字输入框失去焦点
         modules.siderElem.delegate('.node-edit-name .box', 'blur', function(e) {
             var elem = $(this),
                 editnameElem = elem.closest('.node-edit-name'),
                 nameValElem = editnameElem.prev('.fnode-name'),
                 node = elem.closest('.fnode-list');
             if (rfMtrim(elem.val(), '/') === rfMtrim(nameValElem.text(), '/') || elem.val() === '') {
                 toggleEditNameBox(editnameElem);
             } else {
                 tree.renameNode(node.attr('data-fid'), elem.val()).then(function(response) {
                     nameValElem.text(elem.val());
                     toggleEditNameBox(editnameElem);
                 }, function(err) {
                     // 出错直接不修改
                     toggleEditNameBox(editnameElem);
                 });
             }
         });

         // 新建文件夹输入框失去焦点
         modules.siderElem.delegate('.nodeCreatebox .newNodeInput', 'blur', function(e) {
             var elem = $(this),
                 newNodeValue = elem.val();
             if (newNodeValue === '') {
                 elem.closest('.nodeCreateBox').hide();
             } else {
                 var fid = elem.closest('.fnode-list').attr('data-fid');
                 tree.CreateNode(fid, newNodeValue).then(function(response) {
                     elem.closest('.nodeCreateBox').hide();
                 }, function(err) {
                     //此处不处理
                 });
             }
         });

         // 导航栏事件
         modules.crumbs.delegate('.crumb-item', 'click', function(e) {
             var elem = $(this),
                 key = elem.attr('data-path');
             plugin.refreshView(key);
         });

         // object选中事件
         function toggleCheckActions() {
             var num = modules.checkAction.items.length;
             if (num) {
                 modules.checkAction.elem.show()
                 modules.checkAction.elem.find('.text span:first').text(num);
             } else {
                 modules.checkAction.elem.hide();
             }
         };

         // 列表视图文件选择
         modules.listView.delegate('.list-check', 'click', function(e) {
             e.stopPropagation();
             var elem = $(this),
                 type = elem.attr('node-type'),
                 chitems = modules.checkAction.items;
             if (type === 'chkall') {
                 // 全部选择
                 chitems.splice(0, chitems.length);
                 if (modules.listView.chkallBtn.hasClass('check')) {
                     // 撤销所有选中项
                     modules.listView.find('.list-check .fm-icon').each(function() {
                         $(this).removeClass('check')
                             .addClass('blank')
                             .closest('.list').removeClass('item_check');
                     });
                 } else if (modules.listView.chkallBtn.hasClass('blank')) {
                     // 选中所有项
                     modules.listView.find('.list-check .fm-icon').each(function(i) {
                         $(this).removeClass('blank')
                             .addClass('check')
                             .closest('.list').addClass('item_check');
                     });
                     modules.listViewContent.find('.list').each(function() {
                         chitems.push({
                             key: $(this).attr('data-key'),
                             name: $(this).attr('data-name')
                         });
                     });
                 }
             } else if (type === 'chk') {
                 elem.find('.fm-icon').toggleClass('check').toggleClass('blank');
                 var list = elem.closest('.list');
                 if (list.hasClass('item_check')) {
                     for (var i = 0, len = chitems.length, key = list.attr('data-key'); i < len; i++) {
                         if (chitems[i].key === key) {
                             chitems.splice(i, 1);
                             break;
                         }
                     }
                 } else {
                     chitems.push({
                         key: list.attr('data-key'),
                         name: list.attr('data-name')
                     });
                 }
                 list.toggleClass('item_check');
             }
             toggleCheckActions();
         });

         // 列表视图双击打开目录事件
         modules.listView.delegate('.list', 'dblclick', function(e) {
             e.stopPropagation();
             var elem = $(this),
                 key = elem.attr('data-key'),
                 suffix = elem.attr('data-suffix');
             plugin.refreshView(key);
         });

         // 避免双击事件向上冒泡
         modules.listView.delegate('.list-check', 'dblclick', function(e) {
             e.preventDefault();
             e.stopPropagation();
         });

         // 底部按钮mouseover 效果
         modules.checkAction.elem.delegate('a', 'mouseover', function(e) {
             var type = $(this).attr('data-key');
             switch (type) {
                 case 'delete':
                     $(this).children('.fm-icon').css('backgroundPosition', '-179px -128px');
                     break;
                 case 'download':
                     $(this).children('.fm-icon').css('backgroundPosition', '-182px -37px');
                     break;
                 case 'getimage':
                     $(this).children('.fm-icon').css('backgroundPosition', '-227px -417px');
                     break;
             }
         });

         // 底部按钮mouseout 效果
         modules.checkAction.elem.delegate('a', 'mouseout', function(e) {
             var type = $(this).attr('data-key');
             switch (type) {
                 case 'delete':
                     $(this).children('.fm-icon').css('backgroundPosition', '');
                     break;
                 case 'download':
                     $(this).children('.fm-icon').css('backgroundPosition', '');
                     break;
                 case 'getimage':
                     $(this).children('.fm-icon').css('backgroundPosition', '');
                     break;
             }
         });

         // 选中项具体操作
         modules.checkAction.elem.delegate('a', 'click', function(e) {
             var type = $(this).attr('data-key'),
                 info,
                 items = modules.checkAction.items,
                 item;
             switch (type) {
                 case 'delete':
                     //因为可能删除目录，所有删除的操作交给tree来操作
                     if (window.confirm('你确定要删除所选项吗？')) {
                         var env = tree.resolveEnv(),
                             keys = [],
                             key;
                         for (var i = 0, len = items.length; i < len; i++) {
                             keys.push(items[i].key);
                         }
                         if (!keys.length) return;
                         env.service.deleteObjects(env.bucket, keys)
                             .done(function(response) {
                                 // 直接刷新当前视图，并从目录树中删除存在的目录
                                 var node,
                                     last = response.last || [];
                                 $.each(keys, function(i, key) {

                                     if (!(key in last)) {

                                         node = tree.resolveNodeFromKey(key);
                                         console.log(node, key);
                                         if (node)
                                             tree.__deleteNode(node.__ID);
                                     } else {
                                         // 报告删除失败的key
                                     }

                                 });
                                 // 刷新当前视图
                                 plugin.refreshView();
                             })
                             .fail(function() {
                                 alert('删除失败');
                             });
                     }
                     break;
                 case 'download':
                     // 只下载文件不下载目录
                     var items = plugin.module.checkAction.items,
                         item;
                     for (var i = 0, len = items.length; i < len; i++) {
                         item = items[i];
                         if (item.address)
                             download(item.name, item.address);
                     }
                     break;
                 case 'getimage':
                     if (plugin.viewType === 'list') {
                         alert('请在grid模式下使用')
                     } else {
                         var items = plugin.module.checkAction.items,
                             item,
                             datas = [];
                         for (var i = 0, len = items.length; i < len; i++) {
                             datas.push(items[i].addr);
                         }
                         mkClipBoard(datas);
                     }

             }
         });

         // ----------------
         // listView 视图事件
         //-------------------------------------------------

         // 自定义事件
         modules.crumbs.bind('refreshStatusBeforeLoad', (function() {
             var elem = modules.crumbs,
                 loadedElem = elem.find('.crumbs-status .loaded'),
                 loadErrorElem = elem.find('.crumbs-status .LoadError'),
                 loadingElem = elem.find('.crumbs-status .Loading');
             return function(event) {
                 loadedElem.hide();
                 loadErrorElem.hide();
                 loadingElem.show();
             }
         }()));

         modules.crumbs.bind('refreshStatusAfterLoad', (function() {
             var elem = modules.crumbs,
                 loadedElem = elem.find('.crumbs-status .Loaded'),
                 loadErrorElem = elem.find('.crumbs-status .LoadError'),
                 loadingElem = elem.find('.crumbs-status .Loading');
             return function(event, err, num) {
                 loadingElem.hide();
                 if (err !== null) {
                     loadErrorElem.text('加载错误').show();
                 } else if (num >= 0) {
                     loadedElem.text('已全部加载,共' + num + '个对象').show();
                     console.log(loadedElem);
                 }
             }
         }()));

         // 刷新crumbs
         modules.crumbs.bind('refreshCrumbs', (function() {
             var elem = modules.crumbs,
                 crumbElem = elem.find('.crumbs');
             return function(event, key) {
                 if (key && typeof key === 'string') {
                     crumbElem.children().each(function(index) {
                         if (index === 0) {
                             if (key === '/')
                                 $(this).hide();
                             else
                                 $(this).show();
                         } else if (index !== 1) {
                             $(this).remove();
                         }
                     });
                     var names = key.split('/'),
                         path = '',
                         tmpl = '',
                         name,
                         i,
                         len,
                         gobackPath = '/';
                     for (i = 0, len = names.length - 1; i < len; i++) {
                         name = names[i];
                         if (!!name) {
                             path += name + '/';
                             if (i !== len - 1) {
                                 tmpl += Template.CrumbsItem.render({
                                     NAME: name,
                                     PATH: path
                                 });
                             } else {
                                 tmpl += Template.CrumbsItemSpan.render({
                                     NAME: name
                                 })
                             }
                             if (i === len - 2) {
                                 gobackPath = path;
                             }
                         }
                     }
                     if (len === 1)
                         gobackPath = '/';
                     crumbElem.append(tmpl);
                 }
             }
         }()));

         // ----------------
         // 工具栏事件
         //-------------------------------------------------
         modules.toolBar
            // 切换视图
            .delegate('.tool', 'click', function(e) {
                 e.stopPropagation();
                 var elem = $(this);
                 if (elem.hasClass('toolbar-list-view')) {
                     modules.toolBar.switchView();
                     plugin.viewType = 'list';
                     modules.gridView.hide();
                     // 获取数据
                     plugin.refreshView();
                 } else if (elem.hasClass('toolbar-grid-view')) {
                     modules.toolBar.switchView();
                     plugin.viewType = 'grid';
                     modules.listView.hide();
                     // 获取数据
                     plugin.refreshView();
                 } else if (elem.hasClass('toolbar-new-dir')) {
                     // 新建文件夹
                     elem.find('.new-dir-box').toggle().find('.box').val('');
                 }
             })
             .delegate('.tool .new-dir-box', 'click', function(e) {
                 e.stopPropagation();
             })
             .delegate('.tool .new-dir-box .sure', 'click', function(e) {
                 var elem = $(this),
                     newName = elem.prev('.box').val(),
                     env = tree.resolveEnv(),
                     fid;
                 fid = (env.folder && env.folder.__ID) || env.bucket.__ID;
                 tree.CreateNode(fid, newName).then(function(response) {
                     plugin.insertNewFolderToView(newName);
                 }, function(err) {

                 });

             })
             .delegate('.tool .new-dir-box .cancel', 'click', function(e) {
                 var elem = $(this);
                 elem.closest('.new-dir-box').toggle().find('.box').val('');
             })
             .delegate('.tool.toolbar-upload .file-upload', 'change', function(e) {
                 // 此处收集文件上传信息，并交由upload来处理
                 Upload.append(this.files);
             });

         // ----------------
         // gridView 视图事件
         //-------------------------------------------------
         modules.gridViewContent
            // 选中对象
            .delegate('.grid-check .fm-icon', 'click', function(e) {
                 var elem = $(this),
                     chitems = modules.checkAction.items,
                     grid = elem.closest('.grid');
                 elem.toggleClass('check_b').toggleClass('blank_b');
                 if (elem.hasClass('check_b')) {
                     chitems.push({
                         key: grid.attr('data-key'),
                         name: grid.attr('data-name'),
                         address: grid.attr('data-address') || '',
                     });
                 } else {
                     // 撤销
                     for (var i = 0, len = chitems.length, key = grid.attr('data-key'); i < len; i++) {
                         if (chitems[i].key === key) {
                             chitems.splice(i, 1);
                             break;
                         }
                     }
                 }
                 toggleCheckActions();
             })
             .delegate('.grid', 'mouseover', function(e) {
                 var elem = $(this);
                 if (!elem.hasClass('grid-active'))
                     elem.addClass('grid-active');
             })
             .delegate('.grid', 'mouseout', function(e) {
                 var elem = $(this),checkBox;
                 checkBox = elem.find('.grid-check .fm-icon')
                 if (!checkBox.hasClass('check_b'))
                     elem.removeClass('grid-active');
             })
             .delegate('.grid', 'dblclick', function(e) {
                 e.stopPropagation();
                 var elem = $(this),
                     key = elem.attr('data-key'),
                     suffix = elem.attr('data-suffix');
                 // 只有目录可以打开
                 if (suffix === 'dir')
                     plugin.refreshView(key);
                 else {
                     // 下载文件 ，普通文件双击直接下载
                     // @TODO
                     logger('非目录不可以打开, 当前版本不支持打开文件', 'error');
                 }
             })
             // 菜单
             .delegate('.grid', 'contextmenu', function(e) {
                 e.preventDefault();
                 e.stopPropagation();
                 var elem = $(this),
                     x = e.originalEvent.x || e.originalEvent.layerX || 0,
                     y = e.originalEvent.y || e.originalEvent.layerY || 0,
                     context = modules.contextMenu.gridViewContext;
                 context.elem.show();
                 if (x && y) {
                     context.elem.css('left', x + 'px').css('top', y + 'px');
                 }
                 $(this).addClass('grid-active');
                 if (!elem.find('.grid-check span').hasClass('check_b')) {
                     elem.find('.grid-check .fm-icon').trigger('click');
                 }
                 context.currentElem = $(this);
             })
             .delegate('.node-edit-name .sure', 'click', function(e) {
                 var elem = $(this),
                     grid = elem.closest('.grid'),
                     suffix = grid.attr('data-suffix'),
                     key = grid.attr('data-key'),
                     node,
                     newName = $(this).prev().val(),
                     env,
                     srcKey,
                     dstKey;

                 // 调用目录树的改名方法
                 if (suffix === 'dir' && (node = tree.resolveNodeFromKey(key))) {
                     if (!isLegalFolderName(newName)) {
                         logger('非法的目录名称');
                         return;
                     }
                     tree.renameNode(node.__ID, newName).then(function(ret) {
                         grid.find('.grid-name').text(newName);
                         grid.attr('data-key', ret.Key);
                         logger(newName + ' 名称修改成功', 'success');
                     }, function(err) {
                         logger(newName + ' 名称修改失败', 'error');
                     });
                 } else {
                     // 修改文件名
                     if (!isLegalFileName(newName)) {
                         logger('非法的文件名称');
                         return;
                     }
                     env = tree.resolveEnv(key);
                     srcKey = key;
                     dstKey = srcKey.replace(/\/([\s\S]*?)\./, '/' + newName + '.');
                     console.log(srcKey, dstKey);
                     env.service.reNameObject(env.bucket, srcKey, dstKey)
                         .done(function(response) {
                             grid.find('.grid-name').text(newName + '.' + suffix);
                             logger(newName + ' 名称修改成功', 'success');
                         })
                         .fail(function(err) {
                             logger(newName + ' 名称修改失败', 'error');
                         });
                 }
                 $(this).closest('.node-edit-name').hide().prev().show();
             })
             .delegate('.node-edit-name .cancel', 'click', function(e) {
                 $(this).closest('.node-edit-name').hide().prev().show();
             });

         // 侧边栏操作
         modules.contextMenu.gridViewContext.elem.delegate('li', 'click', function(e) {
             var elem   = $(this),
                 type   = elem.attr('data-key'),
                 grid   = modules.contextMenu.gridViewContext.currentElem,
                 suffix = grid.attr('data-suffix'),
                 key    = grid.attr('data-key'),
                 node;
             switch (type) {
                 case 'download':
                     if (suffix === 'dir') {
                         alert('目录不可以下载');
                         logger('目录不可以下载', 'error');
                         return;
                     }
                     var address = grid.attr('data-address'),
                         name = grid.attr('data-name') || 'noname';
                     if (!address)
                         address = getDownloadAddress(key);
                     // @TODO 下载接口重现做
                     download(name, address);
                     break;
                 case 'rename':
                     grid.find('.grid-name').hide().next().show().find('.box').focus();
                     break;
                 case 'delete':
                     // 可以从目录树中查找到
                     if (suffix === 'dir' && (node = tree.resolveNodeFromKey(key))) {
                         tree.deleteNode(node.__ID, function(ret) {
                             if (ret) {
                                 grid.remove();
                             } else {
                                 alert('删除失败');
                             }
                         });
                     } else {
                         // 直接调用service删除
                         var env = tree.resolveEnv(key);
                         env.service.deleteFolder(env.bucket, key)
                             .done(function(response) {
                                 grid.remove();
                             })
                             .fail(function(err) {
                                 alert('删除失败');
                             });
                     }
                     break;
             }
             modules.contextMenu.gridViewContext.elem.hide();
         });

         //log 开关
         $('.process-log').click(function(e) {
             modules.Log.toggle();
             $(this).find('.fm-icon').toggleClass('selected');
         });


         logger('初始化事件结束');
    };


    Tree.prototype.objectManipulation = function(fromKey, toKey, type) {
        var tree = this,
            fromNode = tree.resolveNodeFromKey(fromKey),
            toNode = tree.resolveNodeFromKey(toKey);
        // bucket 不同
        if (fromNode.BucketId !== toNode.BucketId) {
            alert('Differnt Bucket');
        } else {
            service = tree.find(toNode.serviceId),
                bucket = tree.find(toNode.bucketId);
            service.moveObject(bucket, fromKey, tokey)
        }

    }

    Plugin.prototype.objectManipulation = function(fromKey, toKey, type) {
        var plugin = this,
            tree = Tree.instance(),
            env = tree.resolveNodeFromKey(toKey);
        if (env) {
            if (type)
                env.service.moveObject(env.bucket, fromKey, toKey)
            else
                env.service.copyObject(env.bucket, fromKey, toKey)
        } else {
            alert('移动失败');
        }
    }

    Plugin.prototype.insertNewFolderToView = function(name) {
        if (!name) return;
        var plugin = this,
            tree = Tree.instance(),
            env = tree.resolveEnv(),
            key = env.folder && env.folder.Key || env.bucket.Key,
            tmpl;
        name = fMtrim(name, '/') + '/';
        key += name;
        if (plugin.viewType === 'list') {
            tmpl = TemplateEngine(Template.ModuleListViewLi, {
                FILE_MODIFIED: '-',
                FILE_SIZE: '-',
                ICON: 'icon_dir',
                FILE_NAME: name, // 兼容oss写法
                KEY: key // 兼容oss写法
            });
            plugin.module.listViewContent.prepend(tmpl);
        } else if (plugin.viewType === 'grid') {
            tmpl = TemplateEngine(Template.ModuleGridViewBox, {
                NAME: name,
                address: '-',
                KEY: key,
                ICON: getIcon(null, 1),
                SUFFIX: 'dir'
            });
            plugin.module.gridViewContent.prepend(tmpl);

        }
    }

    /**
     * 刷新列表视图
     * @param data {Object}
     */
    Plugin.prototype.refreshListView = function(data) {
        var plugin = this,
            listContent = plugin.modules.listViewContent,
            folder,
            file,
            tmpl = '',
            data;
        if (!plugin.modules.listView.is(':visible'))
            plugin.modules.listView.show();
        if (listContent.length) {
            $.each(data.folders, function(index) {
                folder = data.folders[index];
                tmpl += Template.ModuleListViewLi.render({
                    FILE_MODIFIED: folder.LastModified ? formatDate(folder.LastModified, 'yyyy-MM-dd') : '-',
                    FILE_SIZE: '-',
                    ICON: 'icon_dir',
                    NAME: folder.Name || folder.Prefix, // 兼容oss写法
                    KEY: folder.Key || folder.Prefix // 兼容oss写法
                });
            });

            $.each(data.files, function(index) {
                file = data.files[index];
                tmpl += Template.ModuleListViewLi.render({
                    FILE_MODIFIED: formatDate(file.LastModified, 'yyyy-MM-dd') || '-',
                    FILE_SIZE: formatFileSize(file.Size) || '-',
                    address: file.address || '-',
                    ICON: getIcon(getSuffix(file.Name || file.Key)),
                    NAME: file.Name || file.Key, // oss中的文件key为name
                    KEY: file.Key
                });
            });
        }
        listContent.empty().append(tmpl);
        // 重置选中项
        plugin.modules.listView.chkallBtn.addClass('blank').removeClass('check');
        plugin.modules.checkAction.items = [];
    };

    /**
     * 刷新Grid视图
     * @param data {Object}
     */
    Plugin.prototype.refreshGridView = function(datas) {
        var plugin = this,
            modules = plugin.modules,
            gridContent = plugin.modules.gridViewContent,
            tmpl = '',
            src,
            suffix, folder, file,
            folders = datas.folders,
            files = datas.files;

        if (!modules.gridView.is(':visible'))
            modules.gridView.show();

        if (gridContent.length) {
            $.each(folders, function(index) {
                folder = folders[index];
                tmpl += Template.ModuleGridViewBox.render({
                    NAME: folder.Name,
                    address: folder.address || '-',
                    KEY: folder.Key,
                    ICON: getIcon(null, 1),
                    SUFFIX: 'dir'
                });
            });

            $.each(files, function(index) {
                file = files[index];
                suffix = getSuffix(file.Name || file.Key);
                if (isImage(suffix)) {
                    tmpl += Template.ModuleGridViewBox_IMG.render({
                        NAME: file.Name,
                        address: file.address,
                        KEY: file.Key,
                        SUFFIX: suffix
                    });
                } else {
                    tmpl += Template.ModuleGridViewBox.render({
                        NAME: file.Name,
                        address: file.address || '-',
                        suffix: suffix,
                        KEY: file.Key,
                        ICON: getIcon(suffix || 'txt', 1),
                        SUFFIX: suffix,
                    });
                }
            });
        }
        gridContent.empty();
        gridContent.append(tmpl);
        modules.checkAction.items = [];

        // 添加拖拽事件
        modules.gridViewContent.find('.grid').draggable({
            opacity: 0.7,
            helper: 'clone'
        });
        modules.gridViewContent.find('.grid').droppable({
            // activeClass: "ui-state-hover",
            hoverClass: "grid-active",
            drop: function(event, ui) {
                var from = ui.draggable,
                    fromKey,
                    to = $(this),
                    toKey;
                if (from.hasClass('grid') && to.hasClass('grid')) {
                    // to必须为目录
                    if (to.attr('data-type') !== 'dir') {
                        alert('接受项必须为目录');
                    } else {
                        if (from.attr('data-type') === 'dir') {
                            tree.objectManipulation(from.attr('data-key'), to.attr('data-key'), event.metaKey);
                        } else {
                            plugin.objectManipulation(from.attr('data-key'), to.attr('data-key'), event.metaKey);
                        }
                    }
                }
            }
        });
    };

    /**
     * 刷新当前的视图
     * 刷新方式一， 给定key
     * 刷新方式二， 当前环境
     *
     * @param key {String}
     */
    Plugin.prototype.refreshView = function(key) {
        var plugin = this,
            tree = Tree.instance(),
            env;
        if (key && key[0] !== '/') key = '/' + key;

        // 此处要重置tree的currentfolder
        env = tree.resolveEnv(key, true);
        // 检查所点击项是否为目录
        if(!env.folder) {
            logger('非目录不能打开', 'error');
            return;
        }
        $('#flist-' + env.folder.__ID).trigger('dblclick');
    }

    // 导出配置接口
    $.fn.fileManager = function(params) {
        var fMWrapper = $(this).find('.fManagerWrapper'),
            retval,
            plugin;
        if (fMWrapper.length === 0) {
            fMWrapper = $('<div class="fManagerWrapper"></div>');
            $(this).append(fMWrapper);
        }
        plugin = fMWrapper.data('plugin');

        if (!plugin) {
            plugin = new Plugin(fMWrapper, params);
            fMWrapper.data('plugin', plugin);
        }
        return fMWrapper;
    };

}(jQuery, _, document, window));
