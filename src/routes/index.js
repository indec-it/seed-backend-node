const {Router} = require('express');

const authenticateMiddleware = require('./middlewares/authenticate');
const {AppInformation} = require('../model');

class Routes {
    static configure(app) {
        const {StatusController} = require('../controllers');
        app.get('/version', async (req, res) => {
            const [app] = await AppInformation.find().sort({$natural: -1});
            return res.send({app});
        });
        app.get('/ping', StatusController.ping);
        app.get('/ready', StatusController.getStatus);
        app.get('/health', StatusController.getHealth);
        app.use('/api', authenticateMiddleware(), require('./api')(Router()));
        app.use('/mobile', authenticateMiddleware(), require('./mobile')(Router()));
    }
}

module.exports = Routes;
