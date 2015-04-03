// there's already a passport sub-library that'll help us
// do OAuth with twitter
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
	}, function (req, token, tokenSecret, profile, done) {
		// try to replace with req.user
		var hnUserId = req.cookies.user;

		// console.log('hnUserId: ',hnUserId);
		// when the twitter data comes back
		// we'll always call `done` so that passport knows
		// to go on, and what user data to serialize
		User.findOne({id: hnUserId}, function (err, user) {
			console.log('Hello:',profile);
			if (err) done(err);
			// find an existing user from the database
			if (user.twitter.username) done(null, user);
			else {
				// adjust userSchema!
				user.twitter.username = profile.username;
				user.twitter.id = profile.id;
				user.twitter.photo = profile.photos[0].value;
				user.twitter.token = token;
				user.twitter.tokenSecret = tokenSecret;
				user.save(function(err){
					done(null, user);
				});
			}
		});
	}));

	return passport;
};