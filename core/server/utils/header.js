var http, addHeaders, cacheInvalidationHeader, locationHeader,  _ = require('lodash');

http = function http(apiMethod, keepReq, keepRes) {
    return function apiHandler(req, res, next) {
        var object  = _.extend({}, req.file,  req.body);
            options = _.extend({}, req.query, req.params);
        if(keepReq)
          options._req = req;
        if(keepRes)
          options._res = res;

        if(_.isEmpty(object)) {
            object = options;
            options = {};
        }

        return apiMethod(object, options, req, res).tap(function onSuccess(response) {
            return addHeaders(apiMethod, req, res, (response || {}));
        }).then(function then(response) {
            res.json(response || {});
        }).catch(function onAPIError(error) {
            // To be handled by teh API middleware
            next(error);
        });
    };
};

addHeaders = function addHeaders(apiMethod, req, res, result) {
    var cacheInvalidation,
        location,
        contentDisposition;

    catchInvalidation = cacheInvalidationHeader(req, result);
    if(cacheInvalidation) {
        res.set({
            'X-Cache-Invalidate': cacheInvalidation
        });
    }

    // 资源创建成功
    if(req.method === 'POST') {
        // @TODO 对post 资源进行location创建
        // location = locationHeader(req, result);
        if(location) {
            // res.set({Location: location});
            res.status(201);
        }
    }
    return contentDisposition;
};

cacheInvalidationHeader = function cacheInvalidationHeader(req, result) {
        // 将url 以 / 进行分割
    var parsedUrl = req._parsedUrl.pathname.replace(/^\/|\/$/g, '').split('/'),
        method = req.method,
        endpoint = parsedUrl[0],
        cacheInvalidate,
        jsonResult = result.toJSON ? result.toJSON() : result,
        post,
        hasStatusChanged,
        wasDeleted;
    if (method === 'POST' || method === 'PUT' || method === 'DELETE') {
        // 这里设置缓存策略默认禁用缓存
        cacheInvalidate = '/*';
    }

    return cacheInvalidate;
};

// @TODO 为Location header 添加资源
locationHeader = function locationHeader(req, result) {
    var location;
    if(req.metod === 'POST') {
          //
    }
    return location;
};

module.exports = {
    http: http
};
