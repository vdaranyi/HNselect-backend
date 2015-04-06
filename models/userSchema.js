'use strict';
var mongoose = require('mongoose'),
	Twitter = require('twitter'),
	config = require('../env/index'),
  Item = require('./itemSchema');

var Mixed = mongoose.Schema.Types.Mixed;

var userSchema = new mongoose.Schema({
  id: {type: String, index: true, required: true, unique: true},
  submitted: [Number],
  following: [String],
  bookmarks: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Item' }],
  twitter: {
  	token: String,
  	tokenSecret: String,
  	id: String,
  	username: String,
    photo: String
  },
  followers: [String],
  suggestedFollowing: Mixed,
  loggedin: Boolean
}, {strict: false}); // dev only

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
