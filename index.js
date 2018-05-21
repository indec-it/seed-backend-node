require('dotenv').load();
const winston = require('winston');
const app = require('./src/index');
const {NODE_ENV, PORT} = process.env;

app.listen(PORT, () => winston.info('Started at port %s in %s environment..', PORT, NODE_ENV));
