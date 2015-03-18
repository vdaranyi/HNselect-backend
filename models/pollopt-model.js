'use strict';
var path = require('path'),
    mongoose = require('mongoose');

var polloptSchema = new mongoose.Schema({
  by: String,
  id: Number,
  score: Number,
  text: String,
  time: Number,
});

module.exports = mongoose.model('PollOpt', polloptSchema);
