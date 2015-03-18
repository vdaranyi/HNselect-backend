'use strict';
var path = require('path'),
    mongoose = require('mongoose');

// set the database URI based on the NODE_ENV
var DATABASE_URI = require(path.join(__dirname, '../env')).DATABASE_URI;
var db = mongoose.connect(DATABASE_URI).connection;

var commentSchema = new mongoose.Schema({
  by: String,
  id: {type: Number, index: true},
  kids: [Number],
  parent: Number,
  // text: String,
  time: Number,
  // type: String,
  parentStory: Number
});

module.exports = mongoose.model('Comment', commentSchema);
