const {UserService} = require('@indec/heimdall').services;
const PermissionService = require('./permission');
const {UserHierarchy} = require('../model');
const {includes, map, find, concat, orderBy} = require('lodash');
const {roles, states} = require('../common/enums');

class UsersService {
    static getUserService() {
        return UserService;
    }
    static fetchOne(filter) {
        return UserService.fetchOne(filter);
    }

    static async getUsersByRol(profile) {
        if(includes(profile.roles, roles.NATIONAL_COORDINATOR) || includes(profile.roles, roles.NATIONAL_COORDINATOR_RO)) {
            const profiles = await UserService.fetchAll();
            return map(profiles, user => {
                const state = find(states, state => state._id == user.state);
                if(state) {
                    user.stateName = state.name;
                }
                return user;
            });
        } else if (includes(profile.roles, roles.COORDINATOR)) {
            const [subCoordinator, supervisor, pollster, rae] = await Promise.all([
                UserService.search({rol: roles.SUB_COORDINATOR, state: profile.state}),
                UserService.search({rol: roles.SUPERVISOR, state: profile.state}),
                UserService.search({rol: roles.POLLSTER, state: profile.state}),
                UserService.search({rol: roles.RAE, state: profile.state})
            ]);
            const users = concat([], subCoordinator, supervisor, rae, pollster);
            return map(users, user => {
                const state = find(states, state => state._id == user.state);
                if(state) {
                    user.stateName = state.name;
                }
                return user;
            });
        } else if (includes(profile.roles, roles.SUB_COORDINATOR)) {
            const [supervisor, pollster, rae] = await Promise.all([
                UserService.search({rol: roles.SUPERVISOR, state: profile.state}),
                UserService.search({rol: roles.RAE, state: profile.state}),
                UserService.search({rol: roles.POLLSTER, state: profile.state})]);
            const users = concat([], supervisor, rae, pollster);
            return map(users, user => {
                const state = find(states, state => state._id == user.state);
                if(state) {
                    user.stateName = state.name;
                }
                return user;
            });
        } else if (includes(profile.roles, roles.SUPERVISOR)) {
            const [pollster, rae] = await Promise.all([
                UserService.search({rol: roles.RAE, state: profile.state}),
                UserService.search({rol: roles.POLLSTER, state: profile.state})]);
            const users = concat([], rae, pollster);
            return map(users, user => {
                const state = find(states, state => state._id == user.state);
                if(state) {
                    user.stateName = state.name;
                }
                return user;
            });
        }
        return null;
    }

    static async getUsers(filter) {
        const profile = await UserService.fetchOne(filter);
        let query;
        if (includes(profile.roles, roles.COORDINATOR)) {
            query = {coordinator: profile._id};
        } else if (includes(profile.roles, roles.SUB_COORDINATOR)) {
            query = {$or: [{subCoordinator: profile._id}, {subCoordinator: null}]};
        } else if (includes(profile.roles, roles.SUPERVISOR)) {
            query = {supervisor: profile._id};
        }
        const hierarchy = await UserHierarchy.find(query).lean().exec();
        if (!hierarchy.length) {
            return [];
        }
        const idsToFind = map(hierarchy, h => h._id);
        return UserService.fetch(idsToFind);
    }

    static async users(req) {
        const profile = await UserService.fetchOne(req.user.sub);
        const [rol, query] = [
            PermissionService.getPermissions(profile.roles), PermissionService.getUserRolAndQuery(profile)
        ];
        if (rol === roles.NATIONAL_COORDINATOR) {
            const profiles = await UserService.fetchAll();
            return map(profiles, user => {
                const state = find(states, state => state._id == user.state);
                if(state) {
                    user.stateName = state.name;
                }
                return user;
            });
        } else if (rol === roles.SUB_COORDINATOR) {
            const {state} = profile;
            const profiles = await UserService.search({rol, state});

            return map(profiles, user => {
                const state = find(states, state => state._id == user.state);
                if(state) {
                    user.stateName = state.name;
                }
                return user;
            });
        }
        const hierarchy = await UserHierarchy.find(query).lean().exec();
        if (!hierarchy.length) {
            return [];
        }
        const idsToFind = map(hierarchy, h => h._id);
        const profiles = await UserService.fetch(idsToFind);
        return map(profiles, user => {
            const state = find(states, state => state._id == user.state);
            if(state) {
                user.stateName = state.name;
            }
            return user;
        });
    }

    static async UsersToAssign(profile, stateId) {
        const state =  includes(profile.roles, roles.NATIONAL_COORDINATOR) ? stateId : profile.state;
        let [subCoordinator, supervisor, pollster] = await Promise.all([
            UserService.search({rol: roles.SUB_COORDINATOR, state}),
            UserService.search({rol: roles.SUPERVISOR, state}),
            UserService.search({rol: roles.POLLSTER, state})]);
        subCoordinator = orderBy(subCoordinator, ['surname', 'name']);
        supervisor = orderBy(supervisor, ['surname', 'name']);
        pollster = orderBy(pollster, ['surname', 'name']);
        if (includes(profile.roles, roles.NATIONAL_COORDINATOR) || includes(profile.roles, roles.COORDINATOR)) {
            return {subCoordinator, supervisor, pollster};
        }
        return {supervisor, pollster};
    }

    static async getReassignUsers(profile, stateId) {
        const state = roles.NATIONAL_COORDINATOR ? stateId : profile.state;
        const [pollsters, supervisors] = await Promise.all([
            UserService.search({rol: roles.POLLSTER, state: parseInt(state)}),
            UserService.search({rol: roles.SUPERVISOR, state: parseInt(state)})
        ]);
        let users = pollsters;
        if (!includes(profile.roles, roles.SUPERVISOR)) {
            users = concat(pollsters, supervisors);
        } else if (includes(profile.roles, roles.SUPERVISOR)) {
            users.push(profile);
        }
        return users;
    }

    static async getPollstersAndTeamLeaders(profile, stateId) {
        const state = (roles.NATIONAL_COORDINATOR || roles.NATIONAL_COORDINATOR_RO)? stateId : profile.state;
        const [pollsters, supervisors] = await Promise.all([
            UserService.search({rol: roles.POLLSTER, state: parseInt(state)}),
            UserService.search({rol: roles.SUPERVISOR, state: parseInt(state)})
        ]);
        return concat(pollsters, supervisors);
    }

}

module.exports = UsersService;
