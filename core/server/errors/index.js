'use strict';
var _  = require('lodash'),
  path = require('path'),
  Promise = require('bluebird'),
  BadRequestError = require('./bad-request-error'),
  InternalServerError = require('./internal-server-error'),
  NotFoundError = require('./not-found-error'),
  ValidationError = require('./validation-error'),

  errors;

errors = {
    formatHttpErrors: function formatHttpErrors(error) {
        var statusCode = 500,
            errors = [];
        if(!_.isArray(error)) {
            error = [].concat(error);
        }
        _.each(error, function each(errorItem) {
            var errorContent = {};

            statusCode = errorItem.code || 500;
            errorContent.message = _.isString(errorItem) ? errorItem :
                (_.isObject(errorItem) ? errorItem.message : 'UnKnow API');
            errorContent.errorType = errorItem.errorType || 'InternalServerError';
            errors.push(errorContent);
        });

        return {
            errors: errors,
            statusCode: statusCode
        }
    },
    handleAPIError: function handleAPIError(err, req, res, next) {
        var httpErrors = this.formatHttpErrors(err);
        if(err.stack) console.log(err.stack);
        res.status(httpErrors.statusCode).json({
            errors: httpErrors.errors
        });
    }
};

_.each([
    'formatHttpErrors',
    'handleAPIError'
], function(funcName) {
    errors[funcName] = errors[funcName].bind(errors);
});

module.exports = errors;
module.exports.BadRequestError = BadRequestError;
module.exports.InternalServerError = InternalServerError;
module.exports.NotFoundError =  NotFoundError;
module.exports.ValidationError = ValidationError;
