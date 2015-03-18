'use strict';
var path = require('path'),
    mongoose = require('mongoose');

var pollSchema = new mongoose.Schema({
  by: String,
  descendants: Number,
  id: Number,
  kids: [Number],
  parts: [Number],
  score: Number,
  text: String,
  time: Number,
  title: String,
});

module.exports = mongoose.model('Poll', pollSchema);
