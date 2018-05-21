const fs = require('fs');
const winston = require('winston');
const {Router} = require('express');
const {forEach, reject, replace} = require('lodash');

const loadModules = (folder, router) => {
    // Loading modules dynamically
    forEach(
        reject(
            fs.readdirSync(folder),
            file => file === 'index.js'
        ),
        file => {
            const module = replace(file, '.js', '');
            winston.info('Loading %s api...', module);
            router.use(`/${module}`, require(`./${file}`)(Router()));
        }
    );
};

module.exports = router => {
    loadModules('./src/routes/api', router);
    return router;
};
