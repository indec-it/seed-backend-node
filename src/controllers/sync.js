const {SyncLog} = require('../model');
const {DemoSurvey, SurveyAddressService} = require('../services');
const {filter, cloneDeep} = require('lodash');

class SyncController {
    static async isDemoUser(req, res, next) {
        if (!req.user.isDemo) {
            return next();
        }
        try {
            const surveyAddresses = await DemoSurvey.fetch();
            return res.send({surveyAddresses});
        } catch (err) {
            next(err);
        }
    }

    static filterIncorrectSurveys(req, res, next) {
        req.body.surveys = filter(req.body.surveys, s => !!s._id);
        next();
    }

    static async saveStagingSurvey(req, res, next) {
        const surveys = cloneDeep(req.body.surveys);
        if (!surveys || !surveys.length) {
            return next();
        }
        try {
            await SurveyAddressService.saveStagingSurveys(surveys, req.syncLog, req.user);
            return next();
        } catch(err) {
            next(err);
        }
    }

    static async saveSurveyAddress(req, res, next) {
        const syncLog = new SyncLog({
            user: req.user._id,
            received: 0,
            edited: 0,
            visited: 0,
            closed: 0,
            sent: 0,
            created: 0
        });
        const surveys = req.body.surveys;
        if (!surveys || !surveys.length) {
            return next();
        }
        syncLog.received = surveys.length;
        try {
            await SurveyAddressService.saveSurveys(surveys, syncLog, req.user);
            return next();
        }catch (err) {
            next(err);
        }
    }

    static async syncSurveyAddress(req, res, next) {
        try {
            const surveyAddresses = await SurveyAddressService.fetchSync(req.user._id);
            return res.send({surveyAddresses, lastSync: new Date()});
        } catch (err) {
            next(err);
        }
    }
}

module.exports = SyncController;
