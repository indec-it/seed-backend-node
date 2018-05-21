const {MonitoringController} = require('../../controllers');

module.exports = router => {
    router.get('/general', MonitoringController.getGeneralMonitoring);
    router.get('/response', MonitoringController.getResponseMonitoring);
    return router;
};
