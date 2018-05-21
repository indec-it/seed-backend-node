const {mapKeys, concat, forEach, toString, reduce, orderBy, assign, includes} = require('lodash');
const {SurveyAddressService, PermissionService, UsersService} = require('../services');
const {roles} = require('../common/enums');

const ObjectId = require('mongoose').Types.ObjectId;

const reduceMe = objToReduce => reduce(objToReduce, function(result, value) {
    result[value._id] = value;
    return result;
}, {});

class PollstersController {
    static async getPollstersByState(req, res, next) {
        const {filters} = PermissionService.getReviewAggregation(req.user, req.params.stateId);
        mapKeys(filters, (value, key) => {
            filters[`addressInfo.${key}`] = value;
            delete filters[key];
        });
        const UserService = UsersService.getUserService();
        try {
            const [pollsters, heimPollsters, heimSupervisors] = await Promise.all([
                SurveyAddressService.getPollstersMonitoring(filters),
                UserService.search({rol: roles.POLLSTER, state: filters['addressInfo.stateId']}),
                UserService.search({rol: roles.RECUPERATOR, state: filters['addressInfo.stateId']})
            
            ]);
            const users = reduceMe(concat(heimPollsters, heimSupervisors));
            /* eslint lodash/collection-method-value: 0 */
            const p = orderBy(
                forEach(pollsters, pollster => {
                    const u = users[toString(pollster._id)];
                    pollster._id = {};
                    assign(pollster._id, {
                        pollsterName: u ? `${u.surname}, ${u.name}` : 'N/A',
                        id: u._id,
                        stateId: u.state,
                        rol: includes(u.roles, roles.RECUPERATOR) ? 'Supervisor/Recuperador' : 'Encuestador'
                    });
                }), ['_id.pollsterName'], [1]);
            return res.send({pollsters: p});
        } catch (err) {
            next(err);
        }
    }

    static async getPollsterByDate(req, res, next) {
        const {filters} = PermissionService.getReviewAggregation(req.user);
        filters.pollster = ObjectId(req.params.id);
        mapKeys(filters, (value, key) => {
            filters[`addressInfo.${key}`] = value;
            delete filters[key];
        });
        try {
            const pollster = await SurveyAddressService.getPollsterByDate(filters);
            const user = await UsersService.fetchOne(req.params.id);
            const name = user ? `${user.surname}, ${user.name}` : 'N/A';
            return res.send({pollster: {name, dates: pollster}});
        } catch (err) {
            next(err);
        }
    }
}

module.exports = PollstersController;
