const mongoose = require('mongoose');

const Schema = mongoose.Schema;

const LogSchema = new Schema({
    user: {type: String, required: true, ref: 'User'},
    action: {type: String, required: true},
    collectionName: {type: String, required: true},
    query: {
        update: {type: Schema.Types.Mixed},
        filters: {type: Schema.Types.Mixed}
    },
    message: {type: String}
}, {collection: 'log', timestamps: true});

const Log = mongoose.model('Log', LogSchema);

module.exports = Log;
