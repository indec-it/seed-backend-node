module.exports = {
    id: {type: Number},
    order: {type: Number},
    response: {type: Number},
    noResponseReason: {type: Number},
    noResponseReasonSpecification: {type: String},
    noResponseCause: {type: Number},
    disabled: {type: Boolean},
    selectedMember: {type: Boolean},
    responseHouseholdChapter: {type: Boolean},
    valid: {type: Boolean},
    visits: [],
    interruptionReason: {type: Number},
    interruptionSpecification: {type: String}
};
