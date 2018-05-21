const {SyncController} = require('../../controllers');

module.exports = router => {
    router.post('/sync',
        SyncController.isDemoUser,
        SyncController.filterIncorrectSurveys,
        SyncController.saveStagingSurvey,
        SyncController.saveSurveyAddress,
        SyncController.syncSurveyAddress
    );

    return router;
};
