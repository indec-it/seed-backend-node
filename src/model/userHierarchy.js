const mongoose = require('mongoose');

const Schema = mongoose.Schema;
const ObjectId = Schema.ObjectId;

const UserHierarchySchema = new Schema({
    _id: {type: ObjectId, required: true},
    subCoordinator: {type: Schema.Types.ObjectId},
    supervisor: {type: ObjectId}
}, {collection: 'usersHierarchy', timestamps: true});

const UserHierarchy = mongoose.model('UserHierarchy', UserHierarchySchema);

module.exports = UserHierarchy;
