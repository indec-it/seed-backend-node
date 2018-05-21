const ObjectId = require('mongoose').Types.ObjectId;
const {map, filter, toString, mapKeys, assign} = require('lodash');

const PermissionService = require('./permission');
const enums = require('../common/enums');
const {StagingSurvey, SurveyAddress, SyncLog} = require('../model');

const saveSyncLog = (user, surveysOpen, surveyAddresses) =>  new SyncLog({
    user: toString(user),
    received: 0,
    edited: surveysOpen,
    visited: 0,
    closed: 0,
    sent: surveyAddresses,
    created: 0
}).save();

const SURVEY_ADDRESS_PAGE_SIZE = 30;

class SurveyAddressService {
    static create(filter, update) {
        return SurveyAddress.findOne(filter, (err, surveyAddress) => {
            if (!err && update.pollster) {
                if (!surveyAddress) {
                    surveyAddress = new SurveyAddress(filter);
                    surveyAddress.surveyAddressState = enums.surveyAddressState.OPEN;
                }
                surveyAddress.pollster = update.pollster;
                if (update.addressInfo) {
                    surveyAddress.addressInfo = update.addressInfo;
                }

                if (!update.addressInfo) {
                    surveyAddress.addressInfo.pollster = update.pollster;
                }
                surveyAddress.save();
            }
        });
    }

    static setSurveyAddressState(id, status) {
        return SurveyAddress.findOne(
            {_id: ObjectId(id), surveyAddressState: {$gte: enums.surveyAddressState.CLOSED}},
            (err, surveyAddress) => {
                if (!err && surveyAddress) {
                    surveyAddress.surveyAddressState = status;
                    surveyAddress.save();
                    return surveyAddress;
                }
                return err;
            }
        ).exec();
    }

    static getGeneralMonitoring(profile, filters) {
        const {match, group} = PermissionService.getMatchFilters(profile, filters);
        group.stateId = '$stateId';
        delete group.stateName;
        return SurveyAddress.aggregate([
            {
                $project: {
                    stateId: '$addressInfo.stateId',
                    ups: '$addressInfo.ups',
                    area: '$addressInfo.area',
                    supervisor: '$addressInfo.supervisor',
                    subCoordinator: '$addressInfo.subCoordinator',
                    coordinator: '$addressInfo.coordinator',
                    surveyAddressState: 1
                }
            },
            {
                $match: match
            },
            {
                $group: {
                    _id: group,
                    total: {$sum: 1},
                    assigned: {
                        $sum: {
                            $cond: [
                                {$eq: ['$surveyAddressState', 1]}, 1, 0
                            ]
                        }
                    },
                    inProgress: {
                        $sum: {
                            $cond: [
                                {$eq: ['$surveyAddressState', 2]}, 1, 0
                            ]
                        }
                    },
                    resolved: {
                        $sum: {
                            $cond: [
                                {$eq: ['$surveyAddressState', 3]}, 1, 0
                            ]
                        }
                    },
                    closed: {
                        $sum: {
                            $cond: [
                                {$eq: ['$surveyAddressState', 4]}, 1, 0
                            ]
                        }
                    }
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
                    total: '$total',
                    assigned: '$assigned',
                    inProgress: '$inProgress',
                    resolved: '$resolved',
                    closed: '$closed'
                }
            },
            {
                $sort: {
                    '_id.stateId': 1, '_id.ups': 1, '_id.area': 1
                }
            }
        ]).exec();
    }

    static fetch(filters, skip) {
        const match = {};
        if (!filters._id) {
            mapKeys(filters, (value, key) => {
                if (key !== 'surveyAddressState') {
                    match[`addressInfo.${key}`] = value;
                } else if (key === 'surveyAddressState') {
                    match.surveyAddressState = value;
                }
            });
        } else if (filters._id && filters.stateId) {
            match['addressInfo.stateId'] = filters.stateId;
            if (filters.subCoordinator) {
                match['addressInfo.subCoordinator'] = filters.subCoordinator;
            }
            if (filters.supervisor) {
                match['addressInfo.supervisor'] = filters.supervisor;
            }
            match._id = filters._id;
        } else {
            assign(match, filters);
        }

        return SurveyAddress.find(match).populate('address').skip(skip).limit(SURVEY_ADDRESS_PAGE_SIZE).sort({
            'addressInfo.ups': 1,
            'addressInfo.area': 1,
            'address.listNumber': 1
        }).exec();
    }

    static getTotalSurveys(filters) {
        const match = {};
        if (!filters._id) {
            mapKeys(filters, (value, key) => {
                if (key !== 'surveyAddressState') {
                    match[`addressInfo.${key}`] = value;
                } else if (key === 'surveyAddressState') {
                    match.surveyAddressState = value;
                }
            });
        } else if (filters._id && filters.stateId) {
            filter['addressInfo.stateId'] = filters.stateId;
            if (filters.subCoordinator) {
                match['addressInfo.subCoordinator'] = filters.subCoordinator;
            }
            if (filters.supervisor) {
                match['addressInfo.supervisor'] = filters.supervisor;
            }
        }
        return SurveyAddress.count(match).exec();
    }

    static async fetchSync(user) {
        const surveyAddresses = SurveyAddress.find({pollster: user, surveyAddressState: {$lt: enums.surveyAddressState.CLOSED}}).sort({
            'addressInfo.ups': -1,
            'addressInfo.area': -1
        }).populate('address');

        const surveysOpen = map(
            filter(surveyAddresses, s => s.surveyAddressState === enums.surveyAddressState.OPEN),
            surveys => surveys._id
        );
        await SurveyAddress.update({_id: {$in: surveysOpen}}, {$set: {surveyAddressState: enums.surveyAddressState.IN_PROGRESS}}, {multi: true}).exec();
        await saveSyncLog(user, surveysOpen ? surveysOpen.length : 0, surveyAddresses ? surveyAddresses.length : 0);
        return surveyAddresses;
    }

    static saveStagingSurveys(surveys, syncLog, user) {
        return Promise.all(map(surveys,
            survey => {
                survey.pollster = user._id;
                delete survey._id;
                if(!survey.surveyAddressState) {
                    survey.surveyAddressState = enums.surveyAddressState.OPEN;
                }
                const stagingSurvey = new StagingSurvey(survey);
                return stagingSurvey.save();
            }
        ));
    }

    static async saveSurveys(surveys, syncLog, user) {
        await Promise.all(map(surveys,
            survey => {
                if (survey.surveyAddressState === enums.surveyAddressState.CLOSED) {
                    syncLog.closed++;
                }
                if (survey.visits && survey.visits.length) {
                    syncLog.visited++;
                }
                if (!survey.synced) {
                    syncLog.edited++;
                }
                survey.pollster = user._id;
                if(!survey.surveyAddressState || survey.surveyAddressState === enums.surveyAddressState.OPEN) {
                    survey.surveyAddressState = enums.surveyAddressState.IN_PROGRESS;
                }
                return SurveyAddress.findOne({
                    _id: survey._id,
                    pollster: user._id,
                    surveyAddressState: {$lt: enums.surveyAddressState.CLOSED}
                }).exec().then(
                    surveyAddress => {
                        if (!surveyAddress) {
                            return;
                        }
                        surveyAddress.dwellings = survey.dwellings;
                        surveyAddress.dwellingResponse = survey.dwellingResponse;
                        surveyAddress.surveyAddressState = survey.surveyAddressState;
                        return surveyAddress.save();
                    }
                );
            }
        ));
        return syncLog.save();
    }

    static getDwellingsMonitoring(profile, filters) {
        const {match, group} = PermissionService.getMatchFilters(profile, filters);
        match['dwellings.response'] = {$in: [1, 2]};
        match.surveyAddressState = {$in: [enums.surveyAddressState.CLOSED, enums.surveyAddressState.APPROVED]};
        return SurveyAddress.aggregate(
            [
                {
                    $project: {
                        stateId: '$addressInfo.stateId',
                        ups: '$addressInfo.ups',
                        area: '$addressInfo.area',
                        pollster: '$addressInfo.pollster',
                        subCoordinator: '$addressInfo.subCoordinator',
                        supervisor: '$addressInfo.supervisor',
                        surveyAddressState: 1,
                        dwellings: 1
                    }
                },
                {
                    $lookup: {
                        from: 'states',
                        localField: 'stateId',
                        foreignField: '_id',
                        as: 'states'
                    }
                },
                {
                    $unwind: {
                        path: '$states'
                    }
                },
                {
                    $unwind: {
                        path: '$dwellings',
                        preserveNullAndEmptyArrays: false
                    }
                },
                {
                    $match: match
                },
                {
                    $group: {
                        _id: group,
                        total: {$sum: 1},
                        response: {$sum: {$cond: [{$eq: ['$dwellings.response', 1]}, 1, 0]}},
                        noResponse: {$sum: {$cond: [{$eq: ['$dwellings.response', 2]}, 1, 0]}},
                        firstCause: {$sum: {$cond: [{$eq: ['$dwellings.noResponseReason', 1]}, 1, 0]}},
                        secondCause: {$sum: {$cond: [{$eq: ['$dwellings.noResponseReason', 2]}, 1, 0]}},
                        thirdCause: {$sum: {$cond: [{$eq: ['$dwellings.noResponseReason', 3]}, 1, 0]}},
                        fourthCause: {$sum: {$cond: [{$eq: ['$dwellings.noResponseReason', 4]}, 1, 0]}},
                        fifthCause: {$sum: {$cond: [{$eq: ['$dwellings.noResponseReason', 5]}, 1, 0]}},
                        sixthCause: {$sum: {$cond: [{$eq: ['$dwellings.noResponseReason', 6]}, 1, 0]}},
                        seventhCause: {$sum: {$cond: [{$eq: ['$dwellings.noResponseReason', 7]}, 1, 0]}},
                        eigthCause: {$sum: {$cond: [{$eq: ['$dwellings.noResponseReason', 30]}, 1, 0]}},
                    }
                },
                {$sort: {'_id.stateId':  1, '_id.ups': 1, '_id.area': 1}}
            ]
        ).exec();
    }

    static getHouseHoldsMonitoring(profile, filters) {
        const {match, group} = PermissionService.getMatchFilters(profile, filters);
        match.response = {$in: [1, 2]};
        match['households.response'] = {$in: [1, 2]};
        match['households.disabled'] = {$eq: false};
        match.surveyAddressState = {$in: [enums.surveyAddressState.CLOSED, enums.surveyAddressState.APPROVED]};
        return SurveyAddress.aggregate(
            [
                {
                    $unwind: {
                        path: '$dwellings',
                        preserveNullAndEmptyArrays: false
                    }
                },
                {
                    $unwind: {
                        path: '$dwellings.households',
                        preserveNullAndEmptyArrays: false
                    }
                },
                {
                    $project: {
                        stateId: '$addressInfo.stateId',
                        ups: '$addressInfo.ups',
                        area: '$addressInfo.area',
                        pollster: '$addressInfo.pollster',
                        subCoordinator: '$addressInfo.subCoordinator',
                        supervisor: '$addressInfo.supervisor',
                        response: '$dwellings.response',
                        households: '$dwellings.households',
                        surveyAddressState: 1
                    }
                },
                {
                    $lookup: {
                        from: 'states',
                        localField: 'stateId',
                        foreignField: '_id',
                        as: 'states'
                    }
                },
                {
                    $unwind: {
                        path: '$states'
                    }
                },
                {
                    $match: match
                },
                {
                    $group: {
                        _id: group,
                        householdTotal: {$sum: 1},
                        householdResponse: {$sum: {$cond: [{$eq: ['$households.response', 1]}, 1, 0]}},
                        householdNoResponse: {$sum: {$cond: [{$eq: ['$households.response', 2]}, 1, 0]}},
                        householdFirstCause: {$sum: {$cond: [{$gt: ['$households.noResponseCauseAbsence', null]}, 1, 0]}},
                        householdSecondCause: {$sum: {$cond: [{$gt: ['$households.noResponseCauseRejection', null]}, 1, 0]}},
                        householdThirdCause: {$sum: {$cond: [{$gt: ['$households.noResponseCauseOtherCauses', null]}, 1, 0]}},
                    }
                },
                {$sort: {'_id.stateId':  1, '_id.ups': 1, '_id.area': 1}}
            ]
        ).exec();
    }

    static getMembersMonitoring(profile, filters) {
        const {match, group} = PermissionService.getMatchFilters(profile, filters);
        match['response'] = {$in: [1, 2]};
        match['householdResponse'] = {$in: [1, 2]};
        match['householdDisabled'] = {$eq: false};
        match['members.response'] = {$in: [1, 2]};
        match['members.disabled'] = {$eq: false};
        match.surveyAddressState = {$in: [enums.surveyAddressState.CLOSED, enums.surveyAddressState.APPROVED]};
        return SurveyAddress.aggregate(
            [
                {
                    $unwind: {
                        path: '$dwellings',
                        preserveNullAndEmptyArrays: false
                    }
                },
                {
                    $unwind: {
                        path: '$dwellings.households',
                        preserveNullAndEmptyArrays: false
                    }
                },
                {
                    $unwind: {
                        path: '$dwellings.households.members',
                        preserveNullAndEmptyArrays: false
                    }
                },
                {
                    $project: {
                        stateId: '$addressInfo.stateId',
                        ups: '$addressInfo.ups',
                        area: '$addressInfo.area',
                        pollster: '$addressInfo.pollster',
                        subCoordinator: '$addressInfo.subCoordinator',
                        supervisor: '$addressInfo.supervisor',
                        states: '$states',
                        response: '$dwellings.response',
                        householdResponse: '$dwellings.households.response',
                        householdDisabled: '$dwellings.households.disabled',
                        members: '$dwellings.households.members',
                        surveyAddressState: 4
                    }
                },
                {
                    $lookup: {
                        from: 'states',
                        localField: 'stateId',
                        foreignField: '_id',
                        as: 'states'
                    }
                },
                {
                    $unwind: {
                        path: '$states'
                    }
                },
                {
                    $match: match
                },
                {
                    $group: {
                        _id: group,
                        membersTotal: {$sum: 1},
                        membersResponse: {$sum: {$cond: [{$eq: ['$members.response', 1]}, 1, 0]}},
                        membersNoResponse: {$sum: {$cond: [{$eq: ['$members.response', 2]}, 1, 0]}},
                        membersFirstCause: {$sum: {$cond: [{$eq: ['$members.noResponseReason', 7]}, 1, 0]}},
                        membersSecondCause: {$sum: {$cond: [{$eq: ['$members.noResponseReason', 8]}, 1, 0]}},
                        membersThirdCause: {$sum: {$cond: [{$eq: ['$members.noResponseReason', 9]}, 1, 0]}}
                    }
                },
                {$sort: {'_id.stateId':  1, '_id.ups': 1, '_id.area': 1}}
            ]
        ).exec();
    }
    
    static getPollstersMonitoring(filters) {
        return SurveyAddress.aggregate([
            {
                $match: filters
            },
            {
                $group: {
                    _id: '$pollster',
                    total: {$sum: 1},
                    assigned: {
                        $sum: {
                            $cond: [
                                {$eq: ['$surveyAddressState', enums.surveyAddressState.OPEN]}, 1, 0
                            ]
                        }
                    },
                    inProgress: {
                        $sum: {
                            $cond: [
                                {$eq: ['$surveyAddressState', enums.surveyAddressState.IN_PROGRESS]}, 1, 0
                            ]
                        }
                    },
                    closed: {
                        $sum: {
                            $cond: [
                                {$eq: ['$surveyAddressState', enums.surveyAddressState.CLOSED]}, 1, 0
                            ]
                        }
                    },
                    approved: {
                        $sum: {
                            $cond: [
                                {$eq: ['$surveyAddressState', enums.surveyAddressState.APPROVED]}, 1, 0
                            ]
                        }
                    }
                }
            }
        ]);
    }

    static getPollsterByDate(filters) {
        return SurveyAddress.aggregate([
            {
                $match: filters
            },
            {
                $group: {
                    _id: {
                        $dateToString: {
                            format: '%d/%m/%Y',
                            date: '$updatedAt'
                        }
                    },
                    total: {$sum: 1},
                    assigned: {
                        $sum: {
                            $cond: [
                                {$eq: ['$surveyAddressState', 1]}, 1, 0
                            ]
                        }
                    },
                    inProgress: {
                        $sum: {
                            $cond: [
                                {$eq: ['$surveyAddressState', 2]}, 1, 0
                            ]
                        }
                    },
                    closed: {
                        $sum: {
                            $cond: [
                                {$eq: ['$surveyAddressState', 3]}, 1, 0
                            ]
                        }
                    },
                    approved: {
                        $sum: {
                            $cond: [
                                {$eq: ['$surveyAddressState', 4]}, 1, 0
                            ]
                        }
                    }
                }
            },
            {$sort: {_id: 1}}
        ]);
    }
}

module.exports = SurveyAddressService;
