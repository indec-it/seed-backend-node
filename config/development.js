const Config = require('./config');

class Development extends Config {
    static configure(app) {
        super.configure(app);
        app.use(require('cors')({
            credentials: true,
            origin: /^http:\/\/localhost/
        }));
    }
}

module.exports = Development;
