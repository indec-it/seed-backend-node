const {map, assign, find} = require('lodash');
const {PermissionService, FieldMaterialsService} = require('../services');

const {states} = require('../common/enums');

class FieldMaterialsController {
    static async getFieldMaterials(req, res, next) {
        const {match} = PermissionService.getMatchFilters(req.user, req.query);
        const areaGroup = {
            _id: {stateId: '$stateId', ups: '$ups', area: '$area'},
            total: {$sum: 1}
        };
        const dwellingGroup = {
            _id: {stateId: '$stateId'},
            total: {$sum: 1}
        };
        const upsGroup = {
            _id: {stateId: '$stateId', ups: '$ups'},
            total: {$sum: 1}
        };

        try {
            if (req.query.stateId) {
                if (req.query.area) {
                    const dwellings = await FieldMaterialsService.fetch(match);

                    return res.send(
                        map(dwellings, dwelling => {
                            const total = {stateId: match.stateId, ups: match.ups, area: match.area};
                            const state = find(states, {_id: total.stateId});
                            state && assign(total, {stateName: state.name});
                            assign(total, dwelling);
                            return total;
                        })
                    );
                } else if (req.query.ups) {
                    const [areas, dwellings] = await Promise.all([
                        FieldMaterialsService.getSubTotalFieldMaterials(match, areaGroup),
                        FieldMaterialsService.getSubTotalFieldMaterials(match, areaGroup)
                    ]);

                    return res.send(map(areas, area => {
                        const total = {
                            stateId: area._id.stateId,
                            ups: match.ups,
                            area: area._id.area,
                            amountDwelling: area.total
                        };
                        const state = find(states, {_id: total.stateId});
                        state && assign(total, {stateName: state.name});
                        const dwelling = find(dwellings, dwelling => dwelling._id.area == total.area);
                        dwelling && assign(total, {dwelling: dwelling.total});
                        return total;
                    }));
                }

                const [ups, dwellings] = await  Promise.all([
                    FieldMaterialsService.getTotalFieldMaterials(match, areaGroup, {ups: '$_id.ups'}),
                    FieldMaterialsService.getSubTotalFieldMaterials(match, upsGroup)
                ]);

                return res.send(map(ups, up => {
                    const total = {stateId: up._id.stateId, ups: up._id.ups, amountArea: up.total};
                    const state = find(states, {_id: total.stateId});
                    state && assign(total, {stateName: state.name});
                    const dwelling = find(dwellings, dwelling => dwelling._id.ups == total.ups);
                    dwelling && assign(total, {amountDwelling: dwelling.total});
                    return total;
                }));
            }

            const [ups, areas, dwellings] = await Promise.all([
                FieldMaterialsService.getTotalFieldMaterials(match, upsGroup),
                FieldMaterialsService.getTotalFieldMaterials(match, areaGroup),
                FieldMaterialsService.getSubTotalFieldMaterials(match, dwellingGroup)
            ]);

            return res.send(map(ups, up => {
                const total = {stateId: up._id.stateId, amountUps: up.total};
                const state = find(states, {_id: total.stateId});
                state && assign(total, {stateName: state.name});
                const area = find(areas, area => area._id.stateId == total.stateId && area._id.area == total.area);
                area && assign(total, {amountArea: area.total});
                const dwelling = find(dwellings, dwelling => dwelling._id.stateId == total.stateId);
                dwelling && assign(total, {amountDwelling: dwelling.total});
                return total;
            }));
        } catch (err) {
            next(err);
        }
    }
}

module.exports = FieldMaterialsController;
