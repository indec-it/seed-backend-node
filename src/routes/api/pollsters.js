const {PollstersController} = require('../../controllers');

module.exports = router => {
    router.get('/:stateId', PollstersController.getPollstersByState);
    router.get('/:id/pollster', PollstersController.getPollsterByDate);
    return router;
};
