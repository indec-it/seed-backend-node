const mongoose = require('mongoose');

const enums = require('../common/enums');

const Schema = mongoose.Schema;
const ObjectId = Schema.ObjectId;

const DemoSurveySchema = new Schema({
    address: {type: ObjectId, ref: 'Address', required: true},
    dwellings: [],
    dwellingResponse: {type: Number},
    surveyAddressState: {type: Number, default: enums.surveyAddressState.OPENED}
}, {collection: 'demoSurveys', timestamps: true});

const DemoSurveys = mongoose.model('DemoSurveys', DemoSurveySchema);

module.exports = DemoSurveys;
