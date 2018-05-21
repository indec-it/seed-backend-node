const mongoose = require('mongoose');

const Schema = mongoose.Schema;

const AppInformationSchema = new Schema({
    version: {type: String},
    date: {type: String}
}, {collection: 'appInformation', timestamps: true});

const AppInformation = mongoose.model('AppInformation', AppInformationSchema);

module.exports = AppInformation;
