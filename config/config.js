const {SERVER_BODY_LIMIT, MORGAN_FORMAT} = process.env;

class Config {
    static configure(app) {
        app.use(require('body-parser').json(SERVER_BODY_LIMIT ? {limit: SERVER_BODY_LIMIT} : undefined));
        app.use(require('body-parser').urlencoded({extended: true}));

        app.use(require('cookie-parser')());
        app.use(require('morgan')(MORGAN_FORMAT || 'dev'));

        require('node-friendly-response');

        require('../src/helpers/mongoose').configure();
    }
}

module.exports = Config;
