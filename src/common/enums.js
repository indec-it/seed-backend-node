const surveyAddressState = {
    OPEN: 1,
    IN_PROGRESS: 2,
    CLOSED: 3,
    APPROVED: 4
};

const homeState = {
    COMPLETE: 1,
    INCOMPLETE: 2
};

const validationState = {
    VALID: 0,
    REJECTED: 1,
    INCOMPLETE: 2
};

const interruptionType = {
    NEXT_VISIT_SCHEDULED: 1,
    TABLET_ISSUES_NEEDS_REASSIGN: 2,
    TABLET_ISSUES_PAPER_CONTINUED: 3,
    REJECTION: 4,
    OTHER: 5
};

const roles = {
    NATIONAL_COORDINATOR: 'cn',
    NATIONAL_COORDINATOR_RO: 'ro',
    COORDINATOR: 'co',
    SUB_COORDINATOR: 'sc',
    SUPERVISOR: 'su',
    POLLSTER: 'po'
};

const states = [
    {
        '_id': 2,
        'name': 'CABA'
    },
    {
        '_id': 4.0,
        'name': 'GBA Partidos'
    },
    {
        '_id': 6,
        'name': 'Buenos Aires'
    },
    {
        '_id': 10,
        'name': 'Catamarca'
    },
    {
        '_id': 14,
        'name': 'Córdoba'
    },
    {
        '_id': 18,
        'name': 'Corrientes'
    },
    {
        '_id': 22,
        'name': 'Chaco'
    },
    {
        '_id': 26,
        'name': 'Chubut'
    },
    {
        '_id': 30,
        'name': 'Entre Ríos'
    },
    {
        '_id': 34,
        'name': 'Formosa'
    },
    {
        '_id': 38,
        'name': 'Jujuy'
    },
    {
        '_id': 42,
        'name': 'La Pampa'
    },
    {
        '_id': 46,
        'name': 'La Rioja'
    },
    {
        '_id': 50,
        'name': 'Mendoza'
    },
    {
        '_id': 54,
        'name': 'Misiones'
    },
    {
        '_id': 58,
        'name': 'Neuquén'
    },
    {
        '_id': 62,
        'name': 'Río Negro'
    },
    {
        '_id': 66,
        'name': 'Salta'
    },
    {
        '_id': 70,
        'name': 'San Juan'
    },
    {
        '_id': 74,
        'name': 'San Luis'
    },
    {
        '_id': 78,
        'name': 'Santa Cruz'
    },
    {
        '_id': 82,
        'name': 'Santa Fe'
    },
    {
        '_id': 86,
        'name': 'Santiago del Estero'
    },
    {
        '_id': 90,
        'name': 'Tucumán'
    },
    {
        '_id': 94,
        'name': 'Tierra del Fuego'
    }
];

module.exports = {surveyAddressState, homeState, validationState, interruptionType, roles, states};
