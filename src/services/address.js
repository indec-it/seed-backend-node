const {includes, map} = require('lodash');

const PermissionService = require('./permission');
const {Address} = require('../model');
const {roles, states} = require('../common/enums');

class AddressService {

    static fetch(filter) {
        return Address.find(filter).exec();
    }

    static async fetchStates(profile) {
        const filter = {};
        if (!includes(profile.roles, roles.NATIONAL_COORDINATOR) && !includes(profile.roles, roles.NATIONAL_COORDINATOR_RO)) {
            filter._id = profile.state;
        }
        const statesId = await Address.find().distinct('stateId');
        return map(states, state => {
            if (includes(statesId, state._id)) {
                return state;
            }
        });
    }

    static getRegionalProject(profile) {
        const {match} = PermissionService.getMatchFilters(profile);
        return Address.aggregate([
            {$match: match},
            {
                $project: {
                    _id: 1,
                    ups: 1,
                    area: 1,
                    fraction: 1,
                    listNumber: 1,
                    departmentId: 1,
                    segment: 1,
                    stateId: 1,
                    street: 1,
                    streetNumber: 1,
                    subCoordinator: {$cond: ['$subCoordinator', '$subCoordinator', null]},
                    supervisor: {$cond: ['$supervisor', '$supervisor', null]},
                    pollster: {$cond: ['$pollster', '$pollster', null]}
                }
            },
            {
                $sort: {
                    ups: 1, area: 1, listNumber: 1
                }
            }
        ]).exec();
    }

    static getRegionalAggregation(filters, group) {
        return Address.aggregate([
            {
                $match: filters
            },
            {
                $group: {
                    _id: group,
                    count: {$sum: 1}
                }
            },
            {
                $sort: {
                    '_id.ups': 1, '_id.area': 1, '_id.segment': 1, '_id.listNumber': 1, '_id._id': 1
                }
            }
        ]).exec();
    }

    static saveRegionalAssign(filter, update) {
        return Address.update(filter, update, {multi: true}).exec();
    }

    static getGeneralMonitoring(profile, filters) {

        const {match, group} = PermissionService.getMatchFilters(profile, filters);
        group.stateId = '$stateId';
        delete group.stateName;
        return Address.aggregate([
            {
                $match: match
            },
            {
                $group: {
                    _id: group,
                    total: {$sum: 1}
                }
            },
            {
                $lookup:
                {
                    from: 'states',
                    localField: '_id.stateId',
                    foreignField: '_id',
                    as: 'state'
                }
            },
            {
                $unwind: {
                    path : '$state'
                }
            },
            {
                $project: {
                    _id: {stateId: '$_id.stateId', stateName: '$state.name', ups: '$_id.ups', area: '$_id.area'},
                    total: '$total'
                }
            },
            {
                $sort: {
                    '_id.stateId': 1, '_id.ups': 1, '_id.area': 1
                }
            }
        ]).exec();
        
    }
}

module.exports = AddressService;
