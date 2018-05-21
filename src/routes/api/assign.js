const {AssignController} = require('../../controllers');

module.exports = router => {

    router.get('/regionalAssign', AssignController.getGeographic);
    router.get('/getLevels', AssignController.getDynamicAssign);
    router.post('/', AssignController.saveAssign);
    router.post('/dynamic', AssignController.saveDynamicAssign);
    return router;
};
