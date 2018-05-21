const {UserService} = require('@indec/heimdall').services;
const {map, isEmpty, forEach, findIndex} = require('lodash');

const {UserHierarchy} = require('../model');
const PermissionService = require('./permission');

class UserHierarchyService {

    static async getAssignedUsers(user) {
        const query = PermissionService.getUserRolAndQuery(user);
        const hierarchy = await UserHierarchy.find(query).lean().exec();
        if (!hierarchy.length) {
            return [];
        }
        const idsToFind = map(hierarchy, h => h._id);
        return UserService.fetch(idsToFind);
    }

    static async getUsersByRol(user, heimdallUsers) {
        const idsToFind = map(heimdallUsers, h => h._id);
        const {param} = PermissionService.getHierarchyParams(user);
        const users = await UserHierarchy.find({
            [param]: {$exists: true},
            _id: {$in: idsToFind}
        }, {_id: 1}
        ).exec();
        forEach(users, user => heimdallUsers.splice(findIndex(heimdallUsers, u => u._id == user._id), 1));
        return heimdallUsers;
    }

    static saveHierarchy(user, assigns, unassigned) {
        const queryParams = PermissionService.getHierarchyParams(user);
        return new Promise((resolve, reject) => {
            if (!isEmpty(assigns)) {
                forEach(assigns, assign => {
                    UserHierarchy.findOne({[queryParams.param]: assign[queryParams.param], _id: assign._id},
                        (err, hierarchy) => {
                            if(!err) {
                                if(!hierarchy) {
                                    hierarchy = new UserHierarchy({_id: assign._id});
                                }
                                hierarchy[queryParams.param] = assign[queryParams.param];
                                hierarchy.save();
                            } else {
                                reject(err);
                            }
                        });
                });
            }
            if (!isEmpty(unassigned)) {
                forEach(unassigned, unassigned => {
                    UserHierarchy.find({_id: unassigned._id}).remove().exec();
                });
            }
            resolve(true);
        });
    }
}


module.exports = UserHierarchyService;
