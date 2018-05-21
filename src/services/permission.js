const {includes, assign, parseInt, isEmpty} = require('lodash');
const {roles} = require('../common/enums');

const ObjectId = require('mongoose').Types.ObjectId;

class PermissionService {

    static getUserRolAndQuery(profile) {
        if (includes(profile.roles, roles.COORDINATOR)) {
            return {rol: roles.SUB_COORDINATOR};
        }
        if (includes(profile.roles, roles.SUB_COORDINATOR)) {
            return {subCoordinator: ObjectId(profile._id)};
        }
        if (includes(profile.roles, roles.SUPERVISOR)) {
            return {supervisor: ObjectId(profile._id)};
        }
        if (includes(profile.roles, roles.NATIONAL_COORDINATOR)) {
            return {};
        }
        return null;
    }

    static getPermissions(userRoles) {
        if (includes(userRoles, roles.NATIONAL_COORDINATOR) || includes(userRoles, roles.NATIONAL_COORDINATOR_RO)) {
            return roles.NATIONAL_COORDINATOR;
        }
        if (includes(userRoles, roles.COORDINATOR)) {
            return roles.SUB_COORDINATOR;
        }
        if (includes(userRoles, roles.SUB_COORDINATOR)) {
            return roles.SUPERVISOR;
        }
        if (includes(userRoles, roles.SUPERVISOR)) {
            return roles.POLLSTER;
        }
        return null;
    }

    static getAddressPermission(profile) {
        if (includes(profile.roles, roles.COORDINATOR)) {
            return {
                filters: {stateId: profile.state},
                aggregate: {
                    geographic: {ups: '$ups'},
                    itemDescription: ['UPS)', '$ups'],
                    previous: {$cond: ['$subCoordinator', true, false]},
                    taken: {$cond: ['$subCoordinator', '$subCoordinator', null]}
                }
            };
        } else if (includes(profile.roles, roles.SUB_COORDINATOR)) {
            return {
                filters: {subCoordinator: ObjectId(profile._id), stateId: profile.state},
                aggregate: {
                    geographic: {ups: '$ups', area: '$area'},
                    itemDescription: ['UPS)', '$ups', ' Area)', '$area'],
                    previous: {$cond: ['$supervisor', true, false]},
                    taken: {$cond: ['$supervisor', '$supervisor', null]}
                }
            };
        } else if (includes(profile.roles, roles.SUPERVISOR)) {
            return {
                filters: {supervisor: ObjectId(profile._id), stateId: profile.state},
                aggregate: {
                    geographic: {_id: '$_id'},
                    itemDescription: [
                        'U)', '$ups', ' A)', '$area', ' ', '$departmentName',
                        ', ', '$entityName', ', ', '$street', ' N°: ', '$streetNumber',
                        ' ', '$listNumber'
                    ],
                    previous: {$cond: ['$pollster', true, false]},
                    taken: {$cond: ['$pollster', '$pollster', null]}
                }
            };
        }
    }

    static getAddressParams(profile) {
        if (includes(profile.roles, roles.COORDINATOR)) {
            return {
                role: 'subCoordinator',
                fields: ['ups'],
                query: {stateId: profile.state, ups: null}
            };
        } else if (includes(profile.roles, roles.SUB_COORDINATOR)) {
            return {
                role: 'supervisor',
                fields: ['ups', 'area'],
                query: {stateId: profile.state, subCoordinator: profile._id, ups: null, area: null}
            };
        } else if (includes(profile.roles, roles.SUPERVISOR)) {
            return {
                role: 'pollster',
                fields: ['_id'],
                query: {stateId: profile.state, supervisor: profile._id, _id: null}
            };
        }
    }

    static getHierarchyParams(profile) {
        if (includes(profile.roles, roles.SUB_COORDINATOR)) {
            return {
                role: 'supervisor',
                param: 'subCoordinator'
            };
        } else if (includes(profile.roles, roles.SUPERVISOR)) {
            return {
                role: 'pollster',
                param: 'supervisor'
            };
        }
    }

    static getMatchFilters(profile, filters) {
        const match = {};
        const group = {};
        if (!isEmpty(filters)) {
            const stateId = parseInt(filters.stateId);
            const ups = parseInt(filters.ups);
            const area = parseInt(filters.area);
            if (filters.area) {
                assign(match, {
                    stateId,
                    ups,
                    area
                });
                assign(group, {area: '$area', ups: '$ups'});
            } else if (filters.ups) {
                assign(match, {stateId, ups});
                assign(group, {area: '$area', ups: '$ups'});
            } else {
                assign(match, {stateId});
                assign(group, {ups: '$ups'});
            }
        }
        
        if (includes(profile.roles, roles.NATIONAL_COORDINATOR) || includes(profile.roles, roles.NATIONAL_COORDINATOR_RO)) {
            return {
                match: assign({}, match),
                group: assign({stateId: '$states._id', stateName: '$states.name'}, group)
            };
        } else if (includes(profile.roles, roles.COORDINATOR)) {
            return {
                match: assign({stateId: profile.state}, match),
                group: assign({stateId: '$states._id', stateName: '$states.name'}, group)
            };
        } else if (includes(profile.roles, roles.SUB_COORDINATOR)) {
            return {
                match: assign({stateId: profile.state, subCoordinator: ObjectId(profile._id)}, match),
                group: assign({stateId: '$states._id', stateName: '$states.name'}, group)
            };
        } else if (includes(profile.roles, roles.SUPERVISOR)) {
            return {
                match: assign({stateId: profile.state, supervisor: ObjectId(profile._id)}, match),
                group: assign({stateId: '$states._id', stateName: '$states.name'}, group)
            };
        } else if (includes(profile.roles, roles.RAE)) {
            return {
                match: assign({stateId: profile.state, subSample: 1}, match),
                group: assign({stateId: '$states._id', stateName: '$states.name'}, group)
            };
        }

        return new Error({name: 'forbiden action', message: 'You are not authorized to do this action'});
    }

    static getReviewAggregation(profile, stateId) {

        const filters = (stateId && {stateId: parseInt(stateId)}) || {};
        if (includes(profile.roles, roles.COORDINATOR)) {
            filters.stateId = profile.state;
        } else if (includes(profile.roles, roles.SUB_COORDINATOR)) {
            filters.stateId = profile.state;
            filters.subCoordinator = ObjectId(profile._id);
        } else if (includes(profile.roles, roles.SUPERVISOR)) {
            filters.stateId = profile.state;
            filters.supervisor = ObjectId(profile._id);
        } else if (includes(profile.roles, roles.POLLSTER)) {
            filters.stateId = profile.stateId;
            filters.pollster = ObjectId(profile._id);
        }
        return {filters, group: {area: '$area', stateId: '$stateId', ups: '$ups'}};
    }

    static getDynamicAssignFilter(profile, query) {
        let stateId = undefined;
        if (includes(profile.roles, roles.NATIONAL_COORDINATOR) || includes(profile.roles, roles.NATIONAL_COORDINATOR_RO)) {
            stateId = parseInt(query.stateId);
        }
        const {filters} = PermissionService.getReviewAggregation(profile, stateId);
        const group = {
            stateId: '$stateId',
            ups: '$ups',
            area: '$area',
            segment: '$segment',
            subSample: '$subSample',
            _id: '$_id',
            address:    { $concat: 
                [ '$street',
                    ', N°: ',
                    {$substr: ['$streetNumber',0 ,9]},
                    ' piso: ',
                    {$substr: ['$floor', 0, 9,]},
                    ', número lista: ',
                    {$substr: ['$listNumber',0 ,9]}
                ]
            },
            subCoordinator: '$subCoordinator',
            supervisor: '$supervisor',
            pollster: '$pollster'
        };
        let {level} = query;
        level = parseInt(level);
        if (level === 1) {
            delete group._id;
            delete group.address;
            delete group.segment;
            if (
                includes(profile.roles, roles.COORDINATOR) ||
                includes(profile.roles, roles.NATIONAL_COORDINATOR) ||
                includes(profile.roles, roles.NATIONAL_COORDINATOR_RO)
            ) {
                delete group.area;
                delete group.pollster;
                delete group.supervisor;
            }
        } else if (level === 2) {
            delete group._id;
            delete group.address;
            if (
                includes(profile.roles, roles.COORDINATOR) ||
                includes(profile.roles, roles.NATIONAL_COORDINATOR) ||
                includes(profile.roles, roles.NATIONAL_COORDINATOR_RO)
            ) {
                delete group.segment;
            }
        } else if (level === 3 && (
            includes(profile.roles, roles.COORDINATOR) ||
            includes(profile.roles, roles.NATIONAL_COORDINATOR) ||
            includes(profile.roles, roles.NATIONAL_COORDINATOR_RO)
        )) {
            delete group._id;
            delete group.address;
        }

        return {group, filters, stateId};
    }

    static getDynamicAssignSaveFilter(profile, assignAddress) {
        const {newSubCoordinator, newSupervisor, newPollster} = assignAddress;
        const {supervisor, pollster} = assignAddress;
        const {stateId, ups, area, segment, _id} = assignAddress;
        const update = {};
        const {filters} = PermissionService.getReviewAggregation(profile, stateId);
        let pollsterReassign = false;
        let addressId = false;

        if (ups && !area) {
            assign(filters, {stateId: parseInt(stateId), ups: parseInt(ups)});
            assign(update, {subCoordinator: newSubCoordinator});
        } else {
            if (newSupervisor && newSupervisor !== supervisor) {
                assign(update, {supervisor: ObjectId(newSupervisor)});
                if (!isEmpty(supervisor)) {
                    assign(filters, {supervisor: ObjectId(supervisor)});
                }
            }

            if (newPollster && newPollster !== pollster) {
                assign(update, {pollster: ObjectId(newPollster)});
                if (!isEmpty(pollster)) {
                    assign(filters, {pollster: ObjectId(pollster)});
                }
                pollsterReassign = true;
            }

            if (_id) {
                assign(filters, {_id});
                if (newPollster && newPollster !== pollster) {
                    pollsterReassign = true;
                }
            }

            if (area && !segment) {
                assign(filters, {stateId: parseInt(stateId), ups: parseInt(ups), area: parseInt(area)});
            }

            if(segment) {
                assign(filters, {stateId: parseInt(stateId), ups: parseInt(ups), area: parseInt(area), segment: parseInt(segment)});
            }
        }

        return {update, pollsterReassign, addressId, filters, newPollster, _id};
    }
}

module.exports = PermissionService;
