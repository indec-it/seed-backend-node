const {SurveySections} = require('../model');

class SurveySectionsService {
    static fetch() {
        return SurveySections.find().exec();
    }
}

module.exports = SurveySectionsService;
