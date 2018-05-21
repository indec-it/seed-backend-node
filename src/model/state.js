const mongoose = require('mongoose');

const Schema = mongoose.Schema;

const StateSchema = new Schema({
    _id: Number,
    name: String
}, {collection: 'states', timestamps: true});

const State = mongoose.model('State', StateSchema);

module.exports = State;
