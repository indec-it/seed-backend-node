const {includes, assign} = require('lodash');
const {FieldMaterials, States,  Address} = require('../model');
const {roles} = require('../common/enums');

class FieldMaterialsService {

    static fetch(filter) {
        delete filter.subCoordinator;
        delete filter.supervisor;
        return FieldMaterials.find(filter).lean().exec();
    }

    static fetchStates(profile) {
        const filter = {};
        if (!includes(profile.roles, roles.NATIONAL_COORDINATOR) && !includes(profile.roles, roles.NATIONAL_COORDINATOR_RO)) {
            filter._id = profile.state;
        }
        return States.find(filter).sort({_id: 1}).lean().exec();
    }

    static getTotalFieldMaterials(match, group, totalGroup) {
        const subGroup = assign({stateId: '$_id.stateId'}, totalGroup);
        return Address.aggregate([
            {
                $match: match
            },
            {
                $group: group
            },
            {
                $group: {
                    _id: subGroup,
                    total: {$sum: 1}
                }
            }
        ]).sort({'_id.stateId': 1, '_id.ups': 1, '_id.area': 1}).exec();
    }

    static getSubTotalFieldMaterials(match, group) {
        return Address.aggregate([
            {
                $match: match
            },
            {
                $group: group
            }
        ]).sort({'_id.stateId': 1, '_id.ups': 1, '_id.area': 1}).exec();
    }
}

module.exports = FieldMaterialsService;
