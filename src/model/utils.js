const
    Errors = require('../helpers/errors');

const NotFoundError = Errors.NotFoundError;


class Utils {

    static checkExistence(elem) {
        if (elem === null) {
            throw new NotFoundError('Entity not found');
        }
    }

    static throwNotFound(model, id) {
        throw new NotFoundError(`No ${model} found for '${id}'`);
    }
}

module.exports = Utils;
