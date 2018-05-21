const mongoose = require('mongoose');

const enums = require('../common/enums');
const members = require('./members');

const Schema = mongoose.Schema;
const ObjectId = Schema.ObjectId;

const SurveyAddressSchema = new Schema({
    address: {type: ObjectId, ref: 'Address', required: true},
    dwellings: [{
        id: {type: Number},
        order: {type: Number},
        response: {type: Number},
        noResponseReason: {type: Number},
        valid: {type: Boolean},
        visits: [],
        disabled: {type: Boolean},
        households: [{
            id: {type: Number},
            order: {type: Number},
            response: {type: Number},
            noResponseReason: {type: Number},
            noResponseCauseAbsence: {type: Number},
            noResponseCauseRejection: {type: Number},
            noResponseCauseOtherCauses: {type: Number},
            valid: {type: Boolean},
            disabled: {type: Boolean},
            visits: [],
            characteristics: {
                exclusiveBathroom: {type: Number},
                exclusiveRoomsQty: {type: Number},
                sleepingRooms: {type: Number},
                valid: {type: Boolean}
            },
            comments: {
                telephone: {type: Number},
                noHasTelephone: {type: Boolean},
                noGiveTelephone: {type: Boolean},
                mobilePhone: {type: Number},
                noHasMobilePhone: {type: Boolean},
                noGiveMobilePhone: {type: Boolean},
                comments: {type: String}
            },
            detection: {
                multipleDwellings: {type: Number},
                sharedFoodExpenses: {type: Number},
                hasDomesticService: {type: Number},
                hasPensioners: {type: Number},
                householdsQty: {type: Number},
                valid: {type: Boolean}
            },
            dwellingCharacteristics: {
                dwellingType: {type: Number},
                dwellingTypeSpecification: {type: String},
                roomsQty: {type: Number},
                floorMaterial: {type: Number},
                floorMaterialSpecification: {type: String},
                ceilingMaterial: {type: Number},
                ceilingMaterialSpecification: {type: String},
                hasInnerLiner: {type: Number},
                cookingFuel: {type: Number},
                cookingFuelSpecification: {type: String},
                waterInstallation: {type: Number},
                waterProvision: {type: Number},
                waterProvisionSpecification: {type: String},
                hasBathroom: {type: Number},
                toiletType: {type: Number},
                toiletDrain: {type: Number},
                valid: {type: Boolean}
            },
            labourSituation: {
                lastWeekWorkOneHour: {type: Number},
                noWorkLastWeekReason: {type: Number},
                noWorkReason: {type: Number},
                lastThirtyDaysSearchWork: {type: Number},
                noSearchWorkReason: {type: Number},
                noSearchWorkReasonSpecification: {type: String},
                weekHours: {type: Number},
                valid: {type: Boolean}
            },
            income: {
                lastMonthIncome: {type: Number},
                noHasIncome: {type: Boolean},
                dontKnowIncome: {type: Boolean},
                totalIncomeStretch: {type: Number},
                perceivedSomeIncome: {type: Number},
                valid: {type: Boolean}
            },
            members: [members]
        }]
    }],
    addressInfo: {
        stateId: {type: Number, required: true},
        ups: {type: Number, required: true},
        area: {type: Number, required: true},
        pollster: {type: ObjectId},
        supervisor: {type: ObjectId},
        subCoordinator: {type: ObjectId}
    },
    dwellingResponse: {type: Number},
    pollster: {type: ObjectId, required: true},
    surveyAddressState: {type: Number, default: enums.surveyAddressState.OPENED},
    valid: {type: Number, default: enums.validationState.INCOMPLETE}
}, {collection: 'surveyAddresses', timestamps: true});

const SurveyAddress = mongoose.model('SurveyAddress', SurveyAddressSchema);

module.exports = SurveyAddress;
