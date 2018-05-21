const {SyncController} = require('../../controllers');

module.exports = router => {
    router.post('/',
        SyncController.isDemoUser,
        SyncController.filterIncorrectSurveys,
        SyncController.saveStagingSurvey,
        SyncController.saveSurveyAddress,
        SyncController.syncSurveyAddress
    );

    return router;
};
