const mongoose = require('mongoose');
const winston = require('winston');

class Mongoose {
    static configure() {
        const {MONGODB_URI} = process.env;

        mongoose.Promise = global.Promise;

        mongoose.connect(MONGODB_URI, {
            poolSize: 20
        });
        mongoose.connection.once('open',
            () => winston.info(
                'Mongoose connected to %s:%s/%s',
                mongoose.connection.host,
                mongoose.connection.port,
                mongoose.connection.db.databaseName
            )
        );
        mongoose.connection.on('close', () => winston.info('connection closed'));
        mongoose.connection.on('error', err => winston.error('connection error %s', err));
    }
}

module.exports = Mongoose;
