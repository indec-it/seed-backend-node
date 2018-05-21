const {DemoSurvey} = require('../model');

class DemoSurveyService {
    static fetch() {
        return DemoSurvey.find().populate('address').lean().exec();
    }
}

module.exports = DemoSurveyService;
