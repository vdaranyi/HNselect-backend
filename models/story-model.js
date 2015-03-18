'use strict';
var path = require('path'),
    mongoose = require('mongoose');

var storySchema = new mongoose.Schema({
  // Not saving all fields
  by: String,
  descendants: Number,
  id: {type: Number, index: true},
  kids: [Number],
  // score: Number,
  time: Number,
  title: String,
  // type: String,
  url: String,
  commenters: [String]
});

module.exports = mongoose.model('Story', storySchema);
