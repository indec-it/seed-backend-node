const express = require('express');
const app = express();

const Config = require(`../config/${process.env.NODE_ENV}`);
const Router = require('./routes');

Config.configure(app);
Router.configure(app);

module.exports = app;
