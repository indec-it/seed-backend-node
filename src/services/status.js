const services = require('@indec/heimdall').services;
const mongoose = require('mongoose');
const {every, concat} = require('lodash');

const pkg = require('../../package');

/**
 * Creates the status object
 * @param {Array<{status}>} deps Required dependencies to work.
 * @param {Array<{status}>} optionalDeps Optional dependencies to work.
 * @returns {{name, status: string, deps}} Returns the status of this app.
 */
const generateStatus = (deps, optionalDeps = []) => ({
    name: pkg.name,
    status: every(deps, ({status: 'ok'}))
        ? every(optionalDeps, ({status: 'ok'})) ? 'ok' : 'degraded'
        : 'down',
    deps: concat(deps, optionalDeps)
});

class StatusService {
    static getStatus() {
        return generateStatus([StatusService.getMongoDBStatus()]);
    }

    static async getHealth() {
        const heimdallStatus = await  StatusService.getHeimdallStatus();
        return generateStatus([StatusService.getMongoDBStatus()], [heimdallStatus]);
        
    }

    static getHeimdallStatus() {
        return services.StatusService.fetchReady();
    }

    static getMongoDBStatus() {
        const connected = mongoose.connection.readyState === 1;
        return {name: 'MongoDB', status: connected ? 'ok' : 'down'};
    }
}

module.exports = StatusService;
