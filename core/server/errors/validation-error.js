'use strict';

function ValidationError(message, offendingProperty) {
    this.message = message;
    console.log('hello');
    this.stack = (new Error()).stack;
    console.log('world');
    this.code = 422;
    if (offendingProperty) {
        this.property = offendingProperty;
    }
    this.errorType = this.name;
}

ValidationError.prototype = Object.create(Error.prototype);
ValidationError.prototype.name = 'ValidationError';

module.exports = ValidationError;
