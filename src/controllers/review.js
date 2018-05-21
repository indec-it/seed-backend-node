const {flatMap, isEmpty, parseInt, find, map, join, get, forEach, compact, orderBy, toString} = require('lodash');

const {surveyAddressState, states} = require('../common/enums');
const {AddressService, PermissionService, UsersService, SurveyAddressService, LogService} = require('../services');

const ObjectId = require('mongoose').Types.ObjectId;
const {UserService} = require('@indec/heimdall').services;

class ReviewController {
    static async getStates(req, res, next) {
        try {
            const states = await AddressService.fetchStates(req.user);
            return res.send({states: compact(states)});
        } catch (err) {
            next (err);
        }
    }

    static async getAdditionalInfo(req, res, next) {
        const {filters, group} = PermissionService.getReviewAggregation(req.user, req.query.stateId);
        try {
            const [regionals, users] = await Promise.all([
                AddressService.getRegionalAggregation(filters, group),
                UsersService.getReassignUsers(req.user, req.query.stateId)
            ]);
            const stateInfo = flatMap(regionals, regions => regions._id); 
            return res.send({stateInfo, users});
        } catch(err) {
            next(err);
        }
    }

    static async getSurveys(req, res, next) {
        const {filters} = PermissionService.getReviewAggregation(req.user, req.query.stateId);
        const {ups, area, status, user} = req.query;
        if (!isEmpty(ups)) {
            filters.ups = parseInt(ups);
        }
        if (!isEmpty(area)) {
            filters.area = parseInt(area);
        }
        if (!isEmpty(status)) {
            filters.surveyAddressState = parseInt(status);
        }
        if (!isEmpty(user)) {
            filters.pollster = ObjectId(user);
        }
        const skip = req.query.skip ? parseInt(req.query.skip) : 0;
        try {
            const [surveyAddress, surveysSize, users] = await Promise.all([
                SurveyAddressService.fetch(filters, skip),
                SurveyAddressService.getTotalSurveys(filters),
                UsersService.getPollstersAndTeamLeaders(req.user, req.query.stateId)
            ]);
            const surveys = orderBy(map(surveyAddress, survey => {
                let rejected = false;
                let valid = true;
                const dwellingsInfo = [];
                const surveyInfo = {};
                const pollster = find(users, user => user._id == survey.pollster);
                const supervisor = find(users, user => user._id == get(survey, 'addressInfo.supervisor'));
                surveyInfo.pollsterName = pollster ? `${pollster.surname}, ${pollster.name}` : 'N/A';
                surveyInfo.supervisorName = supervisor ? `${supervisor.surname}, ${supervisor.name}` : 'N/A';
                const dwellings = survey.dwellings;
                let dwellingCount = 1;
                forEach(dwellings, dwelling => {
                    const d = {};
                    let householdCount = 0;
                    if (dwelling && !dwelling.disabled) {
                        rejected = dwelling.response === 2;
                        valid = dwelling.valid;
                        d.id = dwellingCount;
                        d.households = [];
                        forEach(dwelling.households, household => {
                            let memberCount = 0;
                            if (household && !household.disabled) {
                                d.households[householdCount] = {};
                                rejected = !rejected && household.response === 2 ? true : rejected;
                                valid = valid && !household.valid ? false : valid;
                                d.households[householdCount].members = [];
                                forEach(household.members, member => {
                                    if (member && !member.disabled) {
                                        rejected = !rejected && (member.response === 2 || !member.response) && member.selectedMember ? true : rejected;
                                        valid = valid && !member.valid ? false : valid;
                                        if (member.selectedMember) {
                                            d.households[householdCount].members.push({
                                                id: memberCount + 1,
                                                response: member.response
                                            });
                                        }
                                        memberCount += 1;
                                    }
                                });
                                d.households[householdCount].id = householdCount + 1;
                                d.households[householdCount].response = household.response;
                                d.households[householdCount].memberQuantity = memberCount;
                                householdCount += 1;
                            }
                        });
                        d.householdQuantity = householdCount;
                        dwellingsInfo.push(d);
                        dwellingCount += 1;
                    }
                });
                surveyInfo.info = dwellingsInfo;
                surveyInfo.ups = get(survey, 'addressInfo.ups');
                surveyInfo.area = get(survey, 'addressInfo.area');
                surveyInfo.streetNumber = get(survey, 'address.streetNumber');
                surveyInfo.street = get(survey, 'address.street');
                surveyInfo.listNumber = get(survey, 'address.listNumber');
                surveyInfo.stateId = get(survey, 'addressInfo.stateId');
                surveyInfo.supervisor = get(survey, 'addressInfo.supervisor');
                surveyInfo.stateName = get(survey, 'states.name');
                surveyInfo.subCoordinator = get(survey, 'addressInfo.subCoordinator');
                surveyInfo.valid = valid ? 1 : 2;
                surveyInfo.rejected = rejected;
                surveyInfo._id = survey._id;
                surveyInfo.surveyAddressState = survey.surveyAddressState;
                return surveyInfo;
            }), ['ups', 'area', 'listNumber'], [1, 1, 1]);
            return res.send({surveysAddresses: surveys, surveysSize});
        } catch (err) {
            next(err);
        }
    }

    static async getSurvey(req, res, next) {
        const {filters} = PermissionService.getReviewAggregation(req.user);
        const {id} = isEmpty(req.params) ? req.body : req.params;
        filters._id = ObjectId(id);
        try {
            const [surveyAddress] = await SurveyAddressService.fetch(filters, 0);
            const users= await UserService.fetch([surveyAddress.pollster, surveyAddress.addressInfo.supervisor]);
            const surveyInfo = {};
            const households = flatMap(surveyAddress.dwellings, d => !d.disabled && d.households);
            const members = flatMap(households, h => !h.disabled && h.members);
            let valid = true;
            forEach(surveyAddress.dwellings, dwelling => {
                if (!dwelling.disabled && !dwelling.valid) {
                    valid = false;
                }
            });
            forEach(households, household => {
                if (!household.disabled && !household.valid) {
                    valid = false;
                }
            });
            forEach(members, member => {
                if (!member.disabled && !member.valid && member.selected) {
                    valid = false;
                }
            });
            const pollster = find(users, u => u._id === toString(surveyAddress.pollster));
            const supervisor = find(users, u => u._id === toString(surveyAddress.addressInfo.supervisor));
            surveyInfo.stateName = find(states, s => s._id, get(surveyAddress, 'addressInfo.stateId')).name;
            surveyInfo.address = get(surveyAddress, 'address');
            surveyInfo.pollsterName = pollster ? `${pollster.surname}, ${pollster.name}` : 'N/A';
            surveyInfo.supervisorName = supervisor ? `${supervisor.surname}, ${supervisor.name}` : 'N/A';
            surveyInfo.supervisor = get(surveyAddress, 'addressInfo.supervisor');
            surveyInfo.subCoordinator = get(surveyAddress, 'addressInfo.subCoordinator');
            surveyInfo.updatedAt = get(surveyAddress, 'updatedAt');
            surveyInfo._id = get(surveyAddress, '_id');
            surveyInfo.surveyAddressState = get(surveyAddress, 'surveyAddressState');
            surveyInfo.dwellings = get(surveyAddress, 'dwellings');
            surveyInfo.valid = valid;
            return res.send({surveyAddress: surveyInfo});
        } catch(err) {
            next(err);
        }
    }

    static async reopenSurvey(req, res, next) {
        try {
            await SurveyAddressService.setSurveyAddressState(req.body.id, surveyAddressState.OPEN);
            await LogService.log(
                req.user._id,
                'update',
                'surveyAddresses',
                {update: {surveyAddressState: surveyAddressState.OPEN}, filters: {_id: req.body.id}},
                `Update(reopen) perform on surveyAddresses by the user ${req.user.surname}, ${req.user.username} rol/es: ${join(req.user.roles, ', ')}`
            );
            return next();
        } catch (err) {
            return next(err);
        }
    }

    static async approveSurvey(req, res, next) {
        try {
            await SurveyAddressService.setSurveyAddressState(req.body.id, surveyAddressState.APPROVED);
            await LogService.log(
                req.user._id,
                'update',
                'surveyAddresses',
                {update: {surveyAddressState: surveyAddressState.OPEN}, filters: {_id: req.body.id}},
                `Update(approve) perform on surveyAddresses by the user ${req.user.surname}, ${req.user.username} rol/es: ${join(req.user.roles, ', ')}`
            );
            return next();
        } catch (err) {
            next(err);
        }
    }

    static async reassign(req, res, next) {
        const {id, pollster} = req.body;
        try {
            const surveyAddress = await SurveyAddressService.create({_id: id}, {pollster});

            await AddressService.saveRegionalAssign({_id: surveyAddress.address}, {pollster});
            await LogService.log(
                req.user._id,
                'update',
                'surveyAddresses',
                {update: {pollster}, filters: {_id: id}},
                `Update(reassign) perform on surveyAddresses by the user ${req.user.surname}, ${req.user.username} rol/es: ${join(req.user.roles, ', ')}`
            );
            return next();
        } catch (err) {
            next(err);
        }   
    }
}

module.exports = ReviewController;
