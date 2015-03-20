'use strict';
var mongoose = require('mongoose');

var userSchema = new mongoose.Schema({
  id: {type: String, index: true, required: true, unique: true},
  submitted: [Number],
  following: [String]
});

module.exports = mongoose.model('User', userSchema);
