const {take, drop, negate, toLowerCase, pick, transform, values} = require('lodash');
const Exceptions = require('./errors');

const ValidationError = Exceptions.ValidationError;

const safeApplyCondition = (condition, name, negated) => {
    return (something, message) => {
        if (!condition(something)) {
            throw new ValidationError(message || `Validation error ${something} must ${(negated ? ' not ' : ' ')} be ${toLowerCase(name)}`);
        }
        return something;
    };
};

const _mapToSafeFunction = (result, func, funcName) => {
    if (!/^(isNot).*/.test(funcName) && /^is.*/.test(funcName)) {

        const is = take(funcName, 2).join('');
        const name = drop(funcName, 2).join('');

        result[is + name] = safeApplyCondition(func, name, false);

        result[`${is}Not${name}`] = safeApplyCondition(negate(func), name, true);
    }
};

const Validator = values(transform(_mapToSafeFunction, pick((value, key) => {
    return /^is.*/.test(key);
})));

Validator.Error = ValidationError;

module.exports = Validator;
