'use strict';
var path = require('path'),
    mongoose = require('mongoose');

var DATABASE_URI = require(path.join(__dirname, '../env')).DATABASE_URI;
var db = mongoose.connect(DATABASE_URI).connection;

module.exports = db;
