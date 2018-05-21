const mongoose = require('mongoose');

const enums = require('../common/enums');

const Mixed = mongoose.Schema.Types.Mixed;
const Schema = mongoose.Schema;
const ObjectId = Schema.ObjectId;

const StagingSurveySchema = new Schema({
    address: {type: ObjectId, ref: 'Address'},
    dwellings: {type: Mixed},
    dwellingResponse: {type: Number},
    pollster: {type: ObjectId, required: true},
    surveyAddressState: {type: Number, default: enums.surveyAddressState.OPENED},
    valid: {type: Number, default: enums.validationState.INCOMPLETE}
}, {collection: 'stagingSurveys', timestamps: true});

const StagingSurvey = mongoose.model('StagingSurvey', StagingSurveySchema);

module.exports = StagingSurvey;
