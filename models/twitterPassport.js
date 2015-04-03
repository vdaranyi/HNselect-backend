// there's already a passport sub-library that'll help us
// do OAuth with twitter
var qs = require('querystring'),
	request = require('request');

var TwitterStrategy = require('passport-twitter').Strategy;
var passport = require('passport')
// var User = require('./models/model'),
	config = require('../config');

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

		// find an existing user from the database
		User.findOne({id: hnUserId}, function (err, user) {
			if (err) done(err);
			if (user.twitter.username) {
				done(null, user);
			} else {
				// add twitter twProfile to userSchema
				user.twitter.username = twProfile.username;
				user.twitter.id = twProfile.id;
				user.twitter.photo = twProfile.photos[0].value;
				user.twitter.token = token;
				user.twitter.tokenSecret = tokenSecret;
				user.save(function(err){
					done(null, user);
				});
			}
			oauth = { 
              consumer_key    : config.twitter.consumerKey, 
              consumer_secret : config.twitter.consumerSecret, 
              token           : token, 
              token_secret    : tokenSecret
            }
			getTwitterFollowing(twProfile.username, oauth);
		});
	}));
	return passport;
};

function getTwitterFollowing(twitterHandle, oauth) {
	// currently only getting the first 200 users, either use twitterId (5000) or cursor to next
	var url = "https://api.twitter.com/1.1/friends/list.json?";
	var params = { 
	  screen_name: twitterHandle,
	  cursor: -1,
	  count: 200,
	}

	url += qs.stringify(params)
	request.get({url:url, oauth:oauth, json:true}, function (e, r, result) {
	  var twitterFriends = result.users
	  var friendsArr = []
	  for (var i = 0; i < twitterFriends.length; i++) {
	  	friendsArr.push(twitterFriends[i].screen_name);
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
	  	users = users.map(function(user){
	  		return user.id;
	  	});
	  	
	  	// how do I get it to the frontend?
	  	// after twitter click on extension, return to connections tab and propose twitter follower
	  	console.log('USERS:',users);
	  });
	});
}





