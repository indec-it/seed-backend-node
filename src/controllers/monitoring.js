const {map, assign, reduce, toString} = require('lodash');

const {AddressService, SurveyAddressService} = require('../services');

const reduceMe = objToReduce => reduce(objToReduce, function(result, value) {
    const {stateId, ups, area} = value._id;
    let filterKey = stateId;
    if (ups) {
        filterKey = `${filterKey}${ups}`;
    }
    if (area) {
        filterKey = `${filterKey}${area}`;
    }
    result[filterKey] = value;
    return result;
}, {});

class MonitoringController {
    static async getGeneralMonitoring (req, res, next) {
        try {
            const [addresses, surveyAddresses] = await Promise.all([
                AddressService.getGeneralMonitoring(req.user),
                SurveyAddressService.getGeneralMonitoring(req.user)
            ]);
            const reducedSurveyAddresses = reduceMe(surveyAddresses);
            return res.send(map(addresses, address => {
                const surveyAddress = reducedSurveyAddresses[address._id.stateId] || {
                    total: 0,
                    assigned: 0,
                    inProgress: 0,
                    resolved: 0,
                    closed: 0
                };
                delete surveyAddress._id;
                address.unassigned = address.total - surveyAddress.total;
                delete surveyAddress.total;
                assign(address, surveyAddress);
                return address;
            }));
        } catch (err) {
            next(err);
        }
    }

    static async getResponseMonitoring(req, res, next) {
        try {
            const [generalInfo, dwellings, households, members] = await Promise.all([
                SurveyAddressService.getGeneralMonitoring(req.user, req.query),
                SurveyAddressService.getDwellingsMonitoring(req.user, req.query),
                SurveyAddressService.getHouseHoldsMonitoring(req.user, req.query),
                SurveyAddressService.getMembersMonitoring(req.user, req.query)
            ]);
        
            const reducedDwellings = reduceMe(dwellings);
            const reducedHouseholds = reduceMe(households);
            const reducedMembers = reduceMe(members);
            return res.send(map(generalInfo, general => {
                const {stateId, ups, area} = general._id;
                let filterKey = toString(stateId);

                if (ups) {
                    filterKey = `${filterKey}${ups}`;
                }
                if (area) {
                    filterKey = `${filterKey}${area}`;
                }
                general.onCourse = general.closed + general.resolved;
                const dwelling = reducedDwellings[filterKey] || {
                    total: 0,
                    response: 0,
                    noResponse: 0,
                    firstCause: 0,
                    secondCause: 0,
                    thirdCause: 0,
                    fourthCause: 0,
                    fifthCause: 0,
                    sixthCause: 0,
                    seventhCause: 0,
                    eigthCause: 0
                };

                const household = reducedHouseholds[filterKey] || {
                    householdTotal: 0,
                    householdResponse: 0,
                    householdNoResponse: 0,
                    householdFirstCause: 0,
                    householdSecondCause: 0,
                    householdThirdCause: 0,
                    householdFourthCause: 0
                };

                const member = reducedMembers[filterKey] || {
                    membersTotal: 0,
                    membersResponse: 0,
                    membersNoResponse: 0,
                    membersFirstCause: 0,
                    membersSecondCause: 0,
                    membersThirdCause: 0
                };

                delete dwelling._id;
                delete household._id;
                delete member._id;
                assign(general, dwelling, household, member);
                return general;
            }));
        } catch(err) {
            next(err);
        }
    }
}

module.exports = MonitoringController;
