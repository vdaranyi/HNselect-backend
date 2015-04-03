// there's already a passport sub-library that'll help us
// do OAuth with twitter
var qs = require('querystring'),
	request = require('request'),
	Promise = require('bluebird'),
	mongoose = require('mongoose');

Promise.promisifyAll(mongoose); 

var TwitterStrategy = require('passport-twitter').Strategy;
var passport = require('passport')
// var User = require('./models/model'),
	config = require('../env/index');

exports.setup = function (User) {
	// // when a new user logs in, attach them
	// // to the session
	passport.serializeUser(function (user, done) {
		// console.log(arguments, 'ser')
		// but only bother attaching the _id, no the whoe user
		done(null, user._id);
	});
	// each time a request comes in, use the _id from the session
	// data to attach the user to req.user
	passport.deserializeUser(function (id, done) {
		// console.log(arguments, 'deserial')
		User.findById(id, done);
	});

	// passport syntax for implementing a strategy
	passport.use('twitter-authz', new TwitterStrategy({
		consumerKey: config.twitter.consumerKey,
		consumerSecret: config.twitter.consumerSecret,
		callbackURL: config.twitter.callbackUrl,
		passReqToCallback: true
	}, function (req, token, tokenSecret, twProfile, done) {
		// try to replace with req.user
		var hnUserId = req.cookies.user;
		// console.log(hnUserId);
		// find an existing user from the database
		User.findOne({id: hnUserId}, function (err, user) {
			if (err) done(err);
			if (false) { // TO REVIEW LOGIC user.twitter.token
				done(null, user);
			} else {
				oauth = { 
	              consumer_key    : config.twitter.consumerKey, 
	              consumer_secret : config.twitter.consumerSecret, 
	              token           : token, 
	              token_secret    : tokenSecret
	            }
				getTwitterFollowing(twProfile.username, oauth)
				.then(function(suggestedTwFollowing){
					// add twitter profile to userSchema
					user.twitter.username = twProfile.username;
					user.twitter.id = twProfile.id;
					user.twitter.photo = twProfile.photos[0].value;
					user.twitter.token = token;
					user.twitter.tokenSecret = tokenSecret;
					// add twitter suggested following to userSchema
					user.suggestedFollowing = suggestedTwFollowing;
					console.log('USER',user, suggestedFollowing, twProfile.username);
					return user.saveAsync()
				}, function(err){
					console.log('err: ', err)
				})
				.then(function(user){
						done(null, user);
				}, function(err){
					console.log('ERROR: ', err)
					done(err); 
				});
			}
		});
	}));
	return passport;
};

function getTwitterFollowing(twitterHandle, oauth) {
	return new Promise(function(resolve, reject) {
		// currently only getting the first 200 users, either use twitterId (5000) or cursor to next
		var url = "https://api.twitter.com/1.1/friends/list.json?";
		var params = { 
		  screen_name: twitterHandle,
		  count: 200
		}
		url += qs.stringify(params)
		var cursor = -1; // first result page

		// iterating over all result pages / TO DO
		urlWithCursor = url + "&cursor" + cursor;
			
		request.get({url:urlWithCursor, oauth:oauth, json:true}, function (e, r, result) {
		  var twitterFriends = result.users
		  var friendsArr = []
		  for (var i = 0; i < twitterFriends.length; i++) {
		  	// twitter names are all saved lower case because this is how they are extracted from 
		  	friendsArr.push(twitterFriends[i].screen_name.toLowerCase());
		  } 
		  console.log('TWITTER:',friendsArr);
		  // User.find({twitter: {username: { $in: friendsArr}}}, function(err, users){
		  // 	console.log(users);
		  // });
		  // User.find({'twitter.username': { $in: friendsArr}}).select('-').exec(function(err, users){
		  // 	console.log('USERS:',users);
		  // });
		  return User.find({'twitter.username': { $in: friendsArr}}).exec()
		  .then(function(users){
		  	// users = array of [hnName, twitterHandle]
		  	users = users.map(function(user){
		  		return [user.id, user.twitter.username];
		  	});
		  	console.log('twitter - hn friends:',users);
		  	resolve(users);
		  });
		});
	});
}





