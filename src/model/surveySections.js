const mongoose = require('mongoose');

const Schema = mongoose.Schema;

const SurveySectionSchema = new Schema({
    _id: {type: String, required:true},
    structure: [],
    version: {type: Number}
}, {collection: 'surveySections', timestamps: true});

const SurveySections = mongoose.model('SurveySections', SurveySectionSchema);

module.exports = SurveySections;
