const { UserService } = require('@indec/heimdall').services;
const { findIndex, forEach, filter } = require('lodash');
const { PermissionService, UsersService, UserHierarchyService } = require('../services');

class UsersController {
    static async users(req, res, next) {
        try {
            const users = await UsersService.getUsersByRol(req.user);
            return  res.send({users});
        } catch (err) {
            next(err);
        }
    }

    static async profile(req, res, next) {
        try {
            const profile = await UserService.fetchOne(req.user._id);
            return res.send(profile);
        } catch (err) {
            next(err);
        }
    }

    static async findById(req, res, next) {
        try {
            const profile = await UserService.fetchOne(req.query.id);
            return res.send(profile);
        } catch (err) {
            next(err);
        }
    }

    static async find(req, res, next) {
        try {
            const rol = PermissionService.getPermissions(req.user.roles);
            const {state} = req.user;
            const [assignedUsers, heimdallUsers] = await Promise.all([
                UserHierarchyService.getAssignedUsers(req.user),
                UserService.search({rol, state})
            ]);
            const freeUsers = await UserHierarchyService.getUsersByRol(req.user, heimdallUsers);
            forEach(assignedUsers, user => heimdallUsers.splice(findIndex(heimdallUsers, u => u._id == user._id), 1));
            return res.send({users: {assignedUsers, heimdallUsers: freeUsers}});
        } catch (err) {
            next(err);
        }
    }

    static async saveHierarchy(req, res, next) {
        try {
            const assigns = filter(req.body.assigned, users => users.modified);
            const unassigned = filter(req.body.unassigned, users => users.modified);
            await UserHierarchyService.saveHierarchy(req.user, assigns, unassigned);
            return res.send({success: true});
        } catch (err) {
            next(err);
        }
    }
}

module.exports = UsersController;
