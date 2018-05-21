const {FieldMaterialsController} = require('../../controllers');

module.exports = router => {

    router.get('/general', FieldMaterialsController.getFieldMaterials);
    router.get('/', FieldMaterialsController.getFieldMaterials);
    return router;
};
