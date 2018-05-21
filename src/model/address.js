const mongoose = require('mongoose');

const Schema = mongoose.Schema;
const ObjectId = Schema.ObjectId;

const AddressSchema = new Schema({
    stateId: {type: Number},
    departamentId: {type: Number},
    departamentName: {type: String},
    localityId: {type: Number},
    localityName: {type: String},
    agglomerate: {type: Number},
    entityId: {type: Number},
    entityName: {type: String},
    ups: {type: Number},
    area: {type: Number},
    fraction: {type: Number},
    radio: {type: Number},
    block: {type: Number},
    side: {type: Number},
    listNumber: Number,
    street: {type: String},
    streetNumber: {type: String},
    floor: {type: String},
    department: {type: String},
    room: {type: String},
    type: {type: String},
    sector: {type: String},
    building: {type: String},
    entry: {type: String},
    description: {type: String},
    additionalDescription: {type: String},
    subCoordinator: {type: ObjectId},
    supervisor: {type: ObjectId},
    pollster: {type: ObjectId},
    subSample: {type: Number, default: 0}
}, {collection: 'addresses', timestamps: true});

const Address = mongoose.model('Address', AddressSchema);

module.exports = Address;
