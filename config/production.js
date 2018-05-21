const Config = require('./config');

class Production extends Config {
    static configure(app) {
        super.configure(app);
        app.use(require('cors')());
    }
}

module.exports = Production;
