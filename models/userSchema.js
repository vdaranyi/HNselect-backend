'use strict';
var mongoose = require('mongoose'),
	Twitter = require('twitter'),
	config = require('../config');

var userSchema = new mongoose.Schema({
  id: {type: String, index: true, required: true, unique: true},
  submitted: [Number],
  following: [String],
  bookmarks: [Number],
  twitter: {
  	token: String,
  	tokenSecret: String,
  	id: String,
  	handle: String
  }
});

module.exports = mongoose.model('User', userSchema);
