const ce = require('node-custom-errors');

const Errors = {};

const createError = (errorName) => {
    Errors[errorName] = ce.create(errorName);
};

createError('NotImplementedError');
createError('NotFoundError');
createError('ValidationError');

module.exports = Errors;
