const {includes,  flatMap, forEach, filter, keys, map, isEmpty, join, toString} = require('lodash');

const {
    PermissionService, AddressService, UsersService, SurveyAddressService, LogService
} = require('../services');

const DONE = true;

class AssignController {
    saveLog(user, update, filters, type, place, msg) {
        return LogService.log(
            user,
            type,
            place,
            {update, filters},
            msg
        );
    }

    static async getGeographic(req, res, next) {
        const {filters, aggregate } = PermissionService.getAddressPermission(req.user);
        try {
            const address = await AddressService.getRegionalAggregation(filters, aggregate);
            const users = await UsersService.users(req);
            const regionalAddress = flatMap(address, e => e._id);
            return res.send({regionalAddress, users});
        } catch (err) {
            next(err);
        }
    }

    static async saveAssign(req, res, next) {
        const saveData = filter(req.body, e => e.modified);
        const assignParams = PermissionService.getAddressParams(req.user);
        forEach(saveData, async save => {
            forEach(keys(assignParams.query), field => {
                if (includes(assignParams.fields, field)) {
                    assignParams.query[field] = save.geographic[field];
                }
            });
            const update = {$set: {[assignParams.role]: save.taken}};
            try {
                await AddressService.saveRegionalAssign(assignParams.query, update);
                if (assignParams.role === 'pollster') {
                    await SurveyAddressService.create({address: save.geographic._id}, save.taken);
                }
            } catch (err) {
                next(err);
            }
        });
        return res.send({success: true});
    }

    static async getDynamicAssign(req, res, next) {
        const {group, filters, stateId} = PermissionService.getDynamicAssignFilter(req.user, req.query);
        try {
            const addresses = await AddressService.getRegionalAggregation(filters, group);
            const users = await UsersService.UsersToAssign(req.user, stateId);
            const regionalInfo = map(addresses, address => {
                const data = address._id;
                data.total = address.count;
                return data;
            });
            return res.send({regionalInfo, users});
        } catch (e) {
            return next(e);
        }
    }

    /**
     * caso _id, es asignación o reasignación de una casa
     * caso segmento, area, ups, es asignación o reasignación de un área
     * Para el caso de ups solo es caso de subCoordinador unicamente
     */
    static saveDynamicAssign(req, res, next) {
        const assignController = new AssignController();
        forEach(req.body, async assignAddress => {
            const {
                update, pollsterReassign, filters
            } = PermissionService.getDynamicAssignSaveFilter(req.user, assignAddress);
            if (update.pollster && !filters.pollster) {
                filters.pollster = null;
            }
            if (update.supervisor && !filters.supervisor) {
                filters.supervisor = null;
            }

            if (!isEmpty(update)) {
                try {
                    await assignController.saveLog(
                        req.user._id,
                        'update',
                        'addresses',
                        {update, filters},
                        `Update perform on addresses by the user ${req.user.surname}, ${req.user.username} rol/es: ${join(req.user.roles, ', ')}`
                    );
                    await AddressService.saveRegionalAssign(filters, update);
                    if (pollsterReassign) {
                        await assignController.saveLog(
                            req.user._id,
                            'update/insert',
                            'surveyAddresses',
                            {update, filters},
                            `Update perform on surveyAddresses by the user ${req.user.surname}, ${req.user.username} rol/es: ${join(req.user.roles, ', ')}`
                        );
                    }
                    if (update.pollster) {
                        filters.pollster = update.pollster;
                    }
                    if (update.supervisor) {
                        filters.supervisor = update.supervisor;
                    }
                    if (update.subCoordinator) {
                        filters.subCoordinator = update.subCoordinator;
                    }
                    const addresses = await AddressService.fetch(filters);
                    return map(addresses, async a => {
                        const pollster = a.pollster ? toString(a.pollster) : null;
                        if (pollster) {
                            return await SurveyAddressService.create(
                                {address: a._id},
                                {addressInfo:
                                        {
                                            stateId: a.stateId,
                                            ups: a.ups,
                                            area: a.area,
                                            supervisor: a.supervisor || null,
                                            pollster: a.pollster || null,
                                            subCoordinator: a.subCoordinator || null
                                        },
                                pollster
                                }
                            );
                        }
                        return DONE;
                    }
                    );
                } catch (err) {
                    next(err);
                }                
            }
            return assignAddress;
        });
        return res.send({success: DONE});
    }
}

module.exports = AssignController;
