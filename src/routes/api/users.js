const {UsersController} = require('../../controllers');

module.exports = router => {
    router.get('/', UsersController.users);
    router.get('/find', UsersController.find);
    router.get('/findById', UsersController.findById);
    router.get('/profile', UsersController.profile);
    router.post('/', UsersController.saveHierarchy);
    
    return router;
};
