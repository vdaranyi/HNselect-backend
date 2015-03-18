'use strict';
var path = require('path'),
    mongoose = require('mongoose');

// simple user schema that stores the user's Hacker News username and
// an array of HN usernames of people they're following

var userSchema = new mongoose.Schema({
  hnUsername: String,
  following: [String]
});

// add 'Real Name' and 'Twitter Handle' in next version

module.exports = mongoose.model('User', userSchema);
