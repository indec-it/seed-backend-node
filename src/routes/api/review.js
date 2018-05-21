const {ReviewController} = require('../../controllers');

module.exports = router => {

    router.get('/states', ReviewController.getStates);
    router.get('/stateInfo', ReviewController.getAdditionalInfo);
    router.get('/surveys', ReviewController.getSurveys);
    router.get('/survey/:id/:stateId/surveyDetails', ReviewController.getSurvey);
    router.post('/approve', ReviewController.approveSurvey, ReviewController.getSurvey);
    router.post('/reassign', ReviewController.reassign, ReviewController.getSurvey);
    router.post('/reopen', ReviewController.reopenSurvey, ReviewController.getSurvey);

    return router;
};
