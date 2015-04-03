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
  	username: String,
    photo: String
  },
  loggedin: Boolean
});

userSchema
  .virtual('twitterClient')
  .get(function () {
    // to make requests for twitter data,
    // the client needs our app's "username" and "login"
    // as well as the user token's "username" and "login"
    var clientSetup = {
      consumer_key: config.twitter.consumerKey,
      consumer_secret: config.twitter.consumerSecret,
      access_token_key: this.twitter.token,
      access_token_secret: this.twitter.tokenSecret
    };
    return new Twitter(clientSetup);
  });


module.exports = mongoose.model('User', userSchema);
