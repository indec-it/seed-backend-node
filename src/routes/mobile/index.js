const winston = require('winston');
const {Router} = require('express');
const {forEach} = require('lodash');
const requireDir = require('require-dir');

module.exports = router => {
    forEach(
        requireDir('.'),
        (module, name) => {
            winston.info('Loading %s api...', name);
            router.use(`/${name}`, module(Router()));
        }
    );

    return router;
};
